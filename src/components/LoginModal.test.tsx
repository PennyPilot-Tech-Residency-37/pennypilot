import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "./LoginModal";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import '@testing-library/jest-dom';

jest.mock("firebase/auth", () => ({
getAuth: () => ({}),
createUserWithEmailAndPassword: jest.fn(),
signInWithEmailAndPassword: jest.fn(),
onAuthStateChanged: jest.fn(),
}));

jest.mock("../types/firebaseConfig", () => ({
firebaseConfig: {
    apiKey: "test-key",
    authDomain: "test-domain",
    projectId: "test-project",
    storageBucket: "test-bucket",
    messagingSenderId: "test-sender-id",
    appId: "test-app-id",
},
}));

// user signs up test case
describe("LoginModal - Sign Up flow", () => {
it("calls createUserWithEmailAndPassword when user signs up", async () => {
    const mockOnClose = jest.fn();
    const mockCreateUser = createUserWithEmailAndPassword as jest.Mock;
    mockCreateUser.mockResolvedValueOnce({ user: { uid: "123" } });

    render(<LoginModal open={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("Sign Up"));

    fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
    expect(mockCreateUser).toHaveBeenCalledWith(
        expect.any(Object),
        "test@example.com",
        "password123"
    );
    expect(mockOnClose).toHaveBeenCalled();
    });
});

// user sign up fails test case
it("displays error when sign up fails", async () => {
    const mockCreateUser = createUserWithEmailAndPassword as jest.Mock;
    mockCreateUser.mockRejectedValueOnce(new Error("Signup failed"));

    render(<LoginModal open={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText("Sign Up"));

    fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "fail@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
    expect(mockCreateUser).toHaveBeenCalled();
    expect(screen.getByText(/signup failed/i)).toBeInTheDocument();
    });
});

// mismatch passwords test case
it("shows validation error if passwords do not match", async () => {
    render(<LoginModal open={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText("Sign Up"));

    fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm Password"), {
    target: { value: "differentPassword" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
    expect(
        screen.getByText(/passwords do not match/i)
    ).toBeInTheDocument();
    });
});
});

// user logs in test case
describe("LoginModal - Login flow", () => {
it("calls signInWithEmailAndPassword when user logs in", async () => {
    const mockOnClose = jest.fn();
    const mockSignIn = signInWithEmailAndPassword as jest.Mock;
    mockSignIn.mockResolvedValueOnce({ user: { uid: "456" } });

    render(<LoginModal open={true} onClose={mockOnClose} />);

    fireEvent.click(screen.getByText("Log In"));

    fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "login@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "password123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalledWith(
        expect.any(Object),
        "login@example.com",
        "password123"
    );
    expect(mockOnClose).toHaveBeenCalled();
    });
});

// test comment
// user log in fails test case
it("displays error when login fails", async () => {
    const mockSignIn = signInWithEmailAndPassword as jest.Mock;
    mockSignIn.mockRejectedValueOnce(new Error("Login failed"));

    render(<LoginModal open={true} onClose={jest.fn()} />);

    fireEvent.click(screen.getByText("Log In"));

    fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "wrong@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
    expect(mockSignIn).toHaveBeenCalled();
    expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
});
});
