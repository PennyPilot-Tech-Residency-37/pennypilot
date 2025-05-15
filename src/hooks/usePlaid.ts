import { useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import axios from "axios";

export function usePlaid(onSuccessCallback?: () => void) {
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
        // add user_id if needed
      });
      if (onSuccessCallback) onSuccessCallback();
    },
    onExit: (err, metadata) => {
      if (err) console.error("Plaid Link error:", err);
    },
  });

  return { fetchLinkToken, open, ready, linkToken };
}