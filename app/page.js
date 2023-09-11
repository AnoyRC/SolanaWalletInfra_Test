"use client";
import Image from "next/image";
import { Keypair } from "@solana/web3.js";
import * as bip39 from "bip39";
import { useRef, useState } from "react";
import * as cryptico from "cryptico";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");
  const inputMnemonic = useRef(null);
  const inputPassword = useRef(null);
  const [RSAPubKey, setRSAPubKey] = useState(null);
  const [RSAKey, setRSAKey] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const inputEncryptedMessage = useRef(null);
  const [LCDecryptedMessage, setLCDecryptedMessage] = useState(null);
  const LCPassword = useRef(null);

  //Create Wallet
  const createWallet = () => {
    const mnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    setMnemonic(mnemonic);
    setAddress(keypair.publicKey.toString());
  };

  //Import Wallet
  const importWallet = (mnemonic) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    setMnemonic(mnemonic);
    setAddress(keypair.publicKey.toString());
  };

  //Create RSA Key from Password
  const getKeyFromPassword = (password) => {
    const RSAKey = cryptico.generateRSAKey(password, 1024);
    setRSAPubKey(cryptico.publicKeyString(RSAKey));
    setRSAKey(RSAKey);
  };

  //Encrypt Mnemonic with RSA Public Key
  const encryptMessage = () => {
    const EncryptionResult = cryptico.encrypt(mnemonic, RSAPubKey);
    setEncryptedMessage(EncryptionResult.cipher);
  };

  //Decrypt Encrypted Mnemonic with RSA Private Key
  const decryptMessage = (encryptedMessage) => {
    const DecryptionResult = cryptico.decrypt(encryptedMessage, RSAKey);
    setDecryptedMessage(DecryptionResult.plaintext);
  };

  //Store Encrypted Mnemonic in localStorage
  const storeInLocalStorage = () => {
    localStorage.setItem("secretPair", encryptedMessage);
  };

  //Get Encrypted Mnemonic from localStorage and Decrypt with RSA Private Key from Password
  const getFromLC_Decrypt = (password) => {
    const RSAKey = cryptico.generateRSAKey(password, 1024);
    const encryptedMessage = localStorage.getItem("secretPair");
    const DecryptionResult = cryptico.decrypt(encryptedMessage, RSAKey);
    setLCDecryptedMessage(DecryptionResult.plaintext);
  };

  return (
    <main className="flex min-h-screen flex-col items-center space-y-4 p-24">
      {/* Create Wallet */}
      <button
        onClick={createWallet}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Create Wallet
      </button>
      <h1>{mnemonic}</h1>
      <h1>{address}</h1>

      {/* Import Wallet */}
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

      {/* RSA Public Key from Password */}
      <input
        ref={inputPassword}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Password"
      ></input>
      <button
        onClick={() => {
          if (
            inputPassword.current.value &&
            inputPassword.current.value.length > 0
          )
            getKeyFromPassword(inputPassword.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Create RSA Key
      </button>
      <h1 className="text-center">{RSAPubKey}</h1>

      {/* Encrypt Mnemonic with RSA Public key */}
      <button
        onClick={encryptMessage}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Encrypt
      </button>
      <h1 className="text-center">{encryptedMessage}</h1>

      {/* Decrypt Encrypted Mnemonic with RSA Private Key */}
      <input
        ref={inputEncryptedMessage}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Encrypted Message"
      ></input>
      <button
        onClick={() => {
          if (
            inputEncryptedMessage.current.value &&
            inputEncryptedMessage.current.value.length > 0
          )
            decryptMessage(inputEncryptedMessage.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Decrypt
      </button>
      <h1 className="text-center">{decryptedMessage}</h1>

      {/* Store Encrypted Mnemonic in localStorage */}
      <button
        onClick={storeInLocalStorage}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Store in localStorage
      </button>

      {/* Get Encrypted Mnemonic from localStorage and Decrypt with RSA Private Key from Password */}
      <input
        ref={LCPassword}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Password"
      ></input>
      <button
        onClick={() => {
          if (LCPassword.current.value && LCPassword.current.value.length > 0)
            getFromLC_Decrypt(LCPassword.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Decrypt from localStorage
      </button>
      <h1 className="text-center">{LCDecryptedMessage}</h1>
    </main>
  );
}
