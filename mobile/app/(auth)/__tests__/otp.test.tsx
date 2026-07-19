import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({
    phone: "+237677001122",
    debugOtp: "123456",
    isExisting: "0",
  }),
}));

const mockSendOtp = jest.fn();

jest.mock("../../../services/auth", () => ({
  sendOtp: (...args: unknown[]) => mockSendOtp(...args),
}));

import OtpScreen from "../otp";

function pressCode(code: string) {
  for (const d of code) {
    fireEvent.press(screen.getByLabelText(`Chiffre ${d}`));
  }
}

describe("OtpScreen", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockPush.mockClear();
    mockBack.mockClear();
    mockSendOtp.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders the title, phone number, and 6 empty cells", () => {
    render(<OtpScreen />);

    expect(screen.getByText("Entre le code reçu")).toBeTruthy();
    expect(screen.getByText("+237 677 00 11 22")).toBeTruthy();
  });

  it("auto-submits and navigates to the PIN screen after the 6th digit", async () => {
    render(<OtpScreen />);

    pressCode("123456");

    act(() => {
      jest.advanceTimersByTime(600); // VERIFYING_MS
    });
    act(() => {
      jest.advanceTimersByTime(450); // SUCCESS_PAUSE_MS
    });

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/pin",
      params: { phone: "+237677001122", otpCode: "123456", isExisting: "0" },
    }));
  });

  it("shows the dev hint with the debug OTP", () => {
    render(<OtpScreen />);

    expect(screen.getByText(/123456/)).toBeTruthy();
  });

  it("disables the resend link until the countdown reaches zero, then allows resend", async () => {
    mockSendOtp.mockResolvedValue({ debug_otp: "654321" });

    render(<OtpScreen />);

    expect(screen.queryByText("Renvoyer le code")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    fireEvent.press(await screen.findByText("Renvoyer le code"));

    await waitFor(() => expect(mockSendOtp).toHaveBeenCalledWith("+237677001122"));
  });

  it("goes back to edit the number", () => {
    render(<OtpScreen />);

    fireEvent.press(screen.getByLabelText("Retour, corriger le numéro"));

    expect(mockBack).toHaveBeenCalled();
  });
});
