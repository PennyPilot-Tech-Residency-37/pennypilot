// import { useState, useMemo } from "react";
// import {
//   usePlaidLink,
//   PlaidLinkOnSuccessMetadata,
//   PlaidLinkError,
//   PlaidLinkOnExitMetadata,
//   PlaidLinkOptions
// } from "react-plaid-link";
// import { useAuth } from "../context/auth";
// import axios from "axios";

// export function usePlaid(onSuccessCallback?: () => void) {
//   const { currentUser } = useAuth();
//   const [linkToken, setLinkToken] = useState<string | null>(null);

//   const fetchLinkToken = async () => {
//     if (!currentUser?.uid) {
//       console.warn("❌ currentUser not available yet");
//       return;
//     }

//     try {
//       const res = await axios.post("/api/create_link_token", {
//         key: "dev-test-key",
//         user_id: currentUser.uid,
//       });
//       setLinkToken(res.data.link_token);
//       console.log("✅ Fetched Plaid link token:", res.data.link_token);
//     } catch (err) {
//       console.error("❌ Error fetching link token:", err);
//     }
//   };

//   const plaidConfig: PlaidLinkOptions = useMemo(() => ({
//     token: linkToken || "DUMMY_TOKEN_DO_NOT_USE",
//     onSuccess: async (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => {
//       try {
//         await axios.post("/api/exchange_public_token", {
//           public_token,
//           key: "dev-test-key",
//           user_id: currentUser?.uid,
//         });
//         if (onSuccessCallback) onSuccessCallback();
//       } catch (err) {
//         console.error("❌ Error exchanging token:", err);
//       }
//     },
//     onExit: (error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => {
//       if (error) {
//         console.error("Plaid exited with error:", error);
//       } else {
//         console.log("Plaid exited normally", metadata);
//       }
//     },
//   }), [linkToken, currentUser?.uid, onSuccessCallback]);

//   const { open, ready } = usePlaidLink(plaidConfig || { token: 'DUMMY_TOKEN_DO_NOT_USE', onSuccess: () => {} });

//   return { fetchLinkToken, open, ready, linkToken };
// }
