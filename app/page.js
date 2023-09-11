"use client";
import Image from "next/image";
import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { useState } from "react";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");

  const createWallet = () => {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    setMnemonic(mnemonic);
    setAddress(keypair.publicKey.toString());
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <button onClick={createWallet}>Create Wallet</button>
      <h1>{mnemonic}</h1>
      <h1>{address}</h1>
    </main>
  );
}
