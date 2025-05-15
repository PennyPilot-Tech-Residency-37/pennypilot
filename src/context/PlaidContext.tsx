// import React, { createContext, useContext, useState, ReactNode } from "react";
// import { usePlaidLink } from "react-plaid-link";
// import axios from "axios";
// import { useAuth } from "./auth";

// interface PlaidContextType {
//   linkToken: string | null;
//   fetchLinkToken: () => Promise<void>;
//   openPlaid: () => void;
//   ready: boolean;
// }

// const PlaidContext = createContext<PlaidContextType | undefined>(undefined);

// export const PlaidProvider = ({ children }: { children: ReactNode }) => {
//   const { currentUser } = useAuth();
//   const [linkToken, setLinkToken] = useState<string | null>(null);

//   const fetchLinkToken = async () => {
//     if (!currentUser?.uid) {
//       console.warn("⚠️ Cannot fetch link token: no currentUser.uid");
//       return;
//     }

//     try {
//       const res = await axios.post("/api/create_link_token", {
//         key: "dev-test-key",
//         user_id: currentUser.uid,
//       });
//       setLinkToken(res.data.link_token);
//     } catch (err) {
//       console.error("❌ Error fetching Plaid link token:", err);
//     }
//   };

//   const { open, ready } = usePlaidLink({
//     token: linkToken || "",
//     onSuccess: async (public_token, metadata) => {
//       try {
//         await axios.post("/api/exchange_public_token", {
//           public_token,
//           key: "dev-test-key",
//           user_id: currentUser?.uid,
//         });
//       } catch (err) {
//         console.error("❌ Error exchanging public token:", err);
//       }
//     },
//     onExit: (err, metadata) => {
//       if (err) console.error("Plaid Link error:", err);
//     },
//   });

//   const openPlaid = () => {
//     if (ready) open();
//   };

//   return (
//     <PlaidContext.Provider value={{ linkToken, fetchLinkToken, openPlaid, ready }}>
//       {children}
//     </PlaidContext.Provider>
//   );
// };

// export const usePlaid = () => {
//   const context = useContext(PlaidContext);
//   if (!context) throw new Error("usePlaid must be used within a PlaidProvider");
//   return context;
// };