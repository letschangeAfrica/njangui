import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

jest.mock("../../../services/api", () => {
  class ApiError extends Error {
    constructor(status: number, message: string) {
      super(message);
      this.name = "ApiError";
      (this as any).status = status;
    }
  }
  return { ApiError };
});

const { ApiError } = jest.requireMock("../../../services/api") as {
  ApiError: new (status: number, message: string) => Error & { status: number };
};

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

let mockParams: { phone: string; otpCode: string; isExisting: string } = {
  phone: "+237677001122",
  otpCode: "123456",
  isExisting: "0",
};

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));

const mockLoginUser = jest.fn();
const mockRegisterUser = jest.fn();

jest.mock("../../../services/auth", () => ({
  loginUser: (...args: unknown[]) => mockLoginUser(...args),
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

import PinScreen from "../pin";

function pressCode(code: string) {
  for (const d of code) {
    fireEvent.press(screen.getByLabelText(`Chiffre ${d}`));
  }
}

describe("PinScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockBack.mockClear();
    mockReplace.mockClear();
    mockLoginUser.mockReset();
    mockRegisterUser.mockReset();
    mockParams = { phone: "+237677001122", otpCode: "123456", isExisting: "0" };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("create → confirm → match registers the user", async () => {
    jest.useRealTimers();
    mockRegisterUser.mockResolvedValue({ access_token: "tok", user: {} });
    render(<PinScreen />);

    expect(screen.getByText("Crée ton code secret")).toBeTruthy();

    pressCode("1357");
    expect(await screen.findByText("Confirme ton code")).toBeTruthy();

    pressCode("1357");

    await waitFor(() =>
      expect(mockRegisterUser).toHaveBeenCalledWith("+237677001122", "123456", "1357"),
    );
  });

  it("mismatch on confirm restarts at create with an error", async () => {
    render(<PinScreen />);

    pressCode("1357");
    expect(await screen.findByText("Confirme ton code")).toBeTruthy();

    pressCode("9999");

    expect(await screen.findByText("Les codes ne correspondent pas, réessaie")).toBeTruthy();
    expect(await screen.findByText("Crée ton code secret")).toBeTruthy();
  });

  it("wrong PIN in login mode shows attempts remaining", async () => {
    mockParams = { phone: "+237677001122", otpCode: "123456", isExisting: "1" };
    mockLoginUser.mockRejectedValue(new ApiError(401, "PIN incorrect."));

    render(<PinScreen />);
    expect(screen.getByText("Entre ton code secret")).toBeTruthy();

    pressCode("1357");

    expect(await screen.findByText("Code incorrect. 4 tentative(s) restante(s)")).toBeTruthy();
  });

  it("403 lockout response shows the locked card and disables the keypad", async () => {
    mockParams = { phone: "+237677001122", otpCode: "123456", isExisting: "1" };
    mockLoginUser.mockRejectedValue(
      new ApiError(403, "Compte temporairement bloqué après trop de tentatives. Réessayez dans 30 minute(s)."),
    );

    render(<PinScreen />);
    pressCode("1357");

    expect(await screen.findByText("Trop de tentatives")).toBeTruthy();
    expect(screen.getByLabelText("Chiffre 1").props.accessibilityState?.disabled).toBe(true);
  });

  it("Code oublié navigates back to phone re-verification after a toast", async () => {
    mockParams = { phone: "+237677001122", otpCode: "123456", isExisting: "1" };

    render(<PinScreen />);

    fireEvent.press(screen.getByLabelText("Code oublié ?"));

    expect(await screen.findByText("Retour à la vérification du numéro")).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2400);
    });

    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith("/(auth)/phone"));
  });
});
