"use client";
import Image from "next/image";
import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { useRef, useState } from "react";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");
  const inputMnemonic = useRef(null);

  const createWallet = () => {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    setMnemonic(mnemonic);
    setAddress(keypair.publicKey.toString());
  };

  const importWallet = (mnemonic) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    setMnemonic(mnemonic);
    setAddress(keypair.publicKey.toString());
  };

  return (
    <main className="flex min-h-screen flex-col items-center space-y-4 p-24">
      <button
        onClick={createWallet}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Create Wallet
      </button>
      <h1>{mnemonic}</h1>
      <h1>{address}</h1>
      <input
        ref={inputMnemonic}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="seed phrase"
      ></input>
      <button
        onClick={() => {
          if (
            inputMnemonic.current.value &&
            inputMnemonic.current.value.length > 0
          )
            importWallet(inputMnemonic.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Import Wallet
      </button>
    </main>
  );
}
