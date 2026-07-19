import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => ({ intent: "register" }),
}));

const mockSendOtp = jest.fn();
const mockCheckPhoneExists = jest.fn();

jest.mock("../../../services/auth", () => ({
  sendOtp: (...args: unknown[]) => mockSendOtp(...args),
  checkPhoneExists: (...args: unknown[]) => mockCheckPhoneExists(...args),
}));

import PhoneScreen from "../phone";

// MTN number: prefix 67 → 677001122
const MTN_NUMBER = ["6", "7", "7", "0", "0", "1", "1", "2", "2"];

function pressDigits(digits: string[]) {
  for (const d of digits) {
    fireEvent.press(screen.getByLabelText(`Chiffre ${d}`));
  }
}

describe("PhoneScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockBack.mockClear();
    mockSendOtp.mockReset();
    mockCheckPhoneExists.mockReset();
  });

  it("renders the register title and placeholder", () => {
    render(<PhoneScreen />);

    expect(screen.getByText("Ton numéro de téléphone")).toBeTruthy();
    expect(screen.getByText("6 XX XX XX XX")).toBeTruthy();
  });

  it("detects the carrier as digits are entered and shows the valid-number hint", async () => {
    render(<PhoneScreen />);

    pressDigits(MTN_NUMBER);

    expect(await screen.findByText("MTN")).toBeTruthy();
    expect(await screen.findByText("Numéro MTN valide")).toBeTruthy();
  });

  it("shows an inline error and does not submit when the number is too short", () => {
    render(<PhoneScreen />);

    pressDigits(["6", "7", "7"]);
    fireEvent.press(screen.getByText("Continuer"));

    expect(screen.getByText("Il manque des chiffres — 9 au total")).toBeTruthy();
    expect(mockSendOtp).not.toHaveBeenCalled();
  });

  it("submits and navigates to the OTP screen on a valid number", async () => {
    mockSendOtp.mockResolvedValue({ debug_otp: "123456" });
    mockCheckPhoneExists.mockResolvedValue(false);

    render(<PhoneScreen />);

    pressDigits(MTN_NUMBER);
    fireEvent.press(screen.getByText("Continuer"));

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/otp",
      params: { phone: "+237677001122", debugOtp: "123456", isExisting: "0" },
    }));
  });

  it("shows an inline error and does not navigate if the OTP request fails", async () => {
    mockSendOtp.mockRejectedValue(new Error("network down"));
    mockCheckPhoneExists.mockResolvedValue(false);

    render(<PhoneScreen />);

    pressDigits(MTN_NUMBER);
    fireEvent.press(screen.getByText("Continuer"));

    expect(await screen.findByText("Impossible d'envoyer le code. Réessaie.")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("goes back on the back button", () => {
    render(<PhoneScreen />);

    fireEvent.press(screen.getByLabelText("Retour à l'accueil"));

    expect(mockBack).toHaveBeenCalled();
  });
});
