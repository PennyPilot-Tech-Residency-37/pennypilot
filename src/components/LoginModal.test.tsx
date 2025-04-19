import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginModal from "./LoginModal";
import { createUserWithEmailAndPassword } from "firebase/auth";

jest.mock("firebase/auth", () => ({
    getAuth: () => ({}),
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    onAuthStateChanged: jest.fn(),
}));

jest.mock('../types/firebaseConfig', () => ({
    firebaseConfig: {
    apiKey: 'test-key',
    authDomain: 'test-domain',
    projectId: 'test-project',
    storageBucket: 'test-bucket',
    messagingSenderId: 'test-sender-id',
    appId: 'test-app-id',
    }
}));

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
});
