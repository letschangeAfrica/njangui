import { fireEvent, render, screen } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
}));

import OnboardingScreen from "../onboarding";

describe("OnboardingScreen", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the brand, tagline, and both CTAs", () => {
    render(<OnboardingScreen />);

    expect(screen.getByText("NJANGUI")).toBeTruthy();
    expect(screen.getByText("La réputation qui ouvre les portes")).toBeTruthy();
    expect(screen.getByText("Commencer")).toBeTruthy();
    expect(screen.getByText("Se connecter")).toBeTruthy();
  });

  it("renders the three trust feature cards", () => {
    render(<OnboardingScreen />);

    expect(screen.getByText(/Identité/)).toBeTruthy();
    expect(screen.getByText(/Réputation/)).toBeTruthy();
    expect(screen.getByText(/sécurisé/)).toBeTruthy();
  });

  it("navigates to phone entry with intent=register on 'Commencer'", () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText("Commencer"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/phone",
      params: { intent: "register" },
    });
  });

  it("navigates to phone entry with intent=login on 'Se connecter'", () => {
    render(<OnboardingScreen />);

    fireEvent.press(screen.getByText("Se connecter"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/(auth)/phone",
      params: { intent: "login" },
    });
  });
});
