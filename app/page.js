"use client";
import Image from "next/image";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import { useRef, useState } from "react";
import * as cryptico from "cryptico";
import forge, { random, pki } from "node-forge";

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");
  const inputMnemonic = useRef(null);
  const inputPassword = useRef(null);
  const [RSAPubKey, setRSAPubKey] = useState(null);
  const [RSAKey, setRSAKey] = useState(null);
  const [encryptedMessage1, setEncryptedMessage1] = useState(null);
  const [encryptedMessage2, setEncryptedMessage2] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [LCDecryptedMessage, setLCDecryptedMessage] = useState(null);
  const LCPassword = useRef(null);
  const [balance, setBalance] = useState(0);

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
    const prng = random.createInstance();
    prng.seedFileSync = () => password;
    const { privateKey, publicKey } = pki.rsa.generateKeyPair({
      bits: 512,
      prng,
    });
    setRSAKey(privateKey);
    setRSAPubKey(publicKey);
  };

  //Encrypt Mnemonic with RSA Public Key
  const encryptMessage = () => {
    //Chunk 1 of Mnemonic
    const chunk1 = mnemonic.slice(0, 35);
    const encrypted1 = RSAPubKey.encrypt(chunk1);

    //Chunk 2 of Mnemonic
    const chunk2 = mnemonic.slice(35, mnemonic.length);
    const encrypted2 = RSAPubKey.encrypt(chunk2);

    //Set Encrypted Mnemonic
    setEncryptedMessage1(encrypted1);
    setEncryptedMessage2(encrypted2);
  };

  //Decrypt Encrypted Mnemonic with RSA Private Key
  const decryptMessage = () => {
    const decrypted1 = RSAKey.decrypt(encryptedMessage1);
    const decrypted2 = RSAKey.decrypt(encryptedMessage2);
    setDecryptedMessage(decrypted1 + decrypted2);
  };

  //Store Encrypted Mnemonic in localStorage
  const storeInLocalStorage = () => {
    localStorage.setItem(
      "secretPair",
      `${encryptedMessage1}---${encryptedMessage2}`
    );
  };

  //Get Encrypted Mnemonic from localStorage and Decrypt with RSA Private Key from Password
  const getFromLC_Decrypt = (password) => {
    //Create RSA Key from Password
    const prng = random.createInstance();
    prng.seedFileSync = () => password;
    const { privateKey } = pki.rsa.generateKeyPair({
      bits: 512,
      prng,
    });

    //Get Encrypted Mnemonic from localStorage
    const secretPair = localStorage.getItem("secretPair");

    //Decrypt Encrypted Mnemonic with RSA Private Key
    const encrypted1 = secretPair.split("---")[0];
    const encrypted2 = secretPair.split("---")[1];
    const decrypted1 = privateKey.decrypt(encrypted1);
    const decrypted2 = privateKey.decrypt(encrypted2);
    setLCDecryptedMessage(decrypted1 + decrypted2);
  };

  const showBalance = async () => {
    console.log(address);
    const connection = new Connection("https://api.devnet.solana.com");
    const pubKey = new PublicKey(address);
    console.log(PublicKey.isOnCurve(pubKey));
    const balance = await connection.getBalance(pubKey, "confirmed");
    setBalance(balance / LAMPORTS_PER_SOL);
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
      <h1 className="text-center">
        {RSAPubKey ? cryptico.publicKeyString(RSAPubKey) : ""}
      </h1>

      {/* Encrypt Mnemonic with RSA Public key */}
      <button
        onClick={encryptMessage}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Encrypt
      </button>
      <h1 className="text-center">{encryptedMessage1 + encryptedMessage2}</h1>

      {/* Decrypt Encrypted Mnemonic with RSA Private Key */}
      <button
        onClick={decryptMessage}
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
      <button
        onClick={showBalance}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Show Balance
      </button>
      <h1 className="text-center">{balance}</h1>
    </main>
  );
}
