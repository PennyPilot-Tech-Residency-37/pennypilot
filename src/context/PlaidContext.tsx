import React, { createContext, useContext, useState, ReactNode } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";

interface PlaidContextType {
  linkToken: string | null;
  fetchLinkToken: () => Promise<void>;
  openPlaid: () => void;
  ready: boolean;
}

const PlaidContext = createContext<PlaidContextType | undefined>(undefined);

export const PlaidProvider = ({ children }: { children: ReactNode }) => {
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const fetchLinkToken = async () => {
    const res = await axios.post("/api/create_link_token", { key: "dev-test-key" });
    setLinkToken(res.data.link_token);
  };

  const { open, ready } = usePlaidLink({
    token: linkToken || "",
    onSuccess: async (public_token, metadata) => {
      await axios.post("/api/exchange_public_token", {
        public_token,
        key: "dev-test-key",
      });
      // Optionally: trigger a refresh of accounts/transactions here
    },
    onExit: (err, metadata) => {
      if (err) console.error("Plaid Link error:", err);
    },
  });

  const openPlaid = () => {
    if (ready) open();
  };

  return (
    <PlaidContext.Provider value={{ linkToken, fetchLinkToken, openPlaid, ready }}>
      {children}
    </PlaidContext.Provider>
  );
};

export const usePlaid = () => {
  const context = useContext(PlaidContext);
  if (!context) throw new Error("usePlaid must be used within a PlaidProvider");
  return context;
};