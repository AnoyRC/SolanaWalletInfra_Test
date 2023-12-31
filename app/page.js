"use client";
import Image from "next/image";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import * as bip39 from "bip39";
import { useRef, useState, useEffect } from "react";
import * as cryptico from "cryptico";
import forge, { random, pki } from "node-forge";
import {
  transfer as tokenTransfer,
  getAccount,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import IDL from "../Idl/idl";
import { AnchorProvider, BN, Program, utils } from "@project-serum/anchor";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import { MyWallet, MyWallet as Wallet } from "@/Class/MyWallet";
import randomId from "random-id";
import * as ed from "@noble/ed25519";
import { sign } from "@noble/ed25519";
import {
  Elusiv,
  SEED_MESSAGE,
  airdropToken,
  getMintAccount,
} from "@elusiv/sdk";
import { sha512 } from "@noble/hashes/sha512";
import fetch from "cross-fetch";
import WebSocket from "isomorphic-ws";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { OnrampWebSDK } from "@onramp.money/onramp-web-sdk";
import nacl from "tweetnacl-sealed-box";
import { hexToBytes } from "node-forge/lib/util";
import { bs58 } from "@project-serum/anchor/dist/cjs/utils/bytes";

ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

const connection = new Connection("https://api.devnet.solana.com");

export default function Home() {
  const [mnemonic, setMnemonic] = useState("");
  const [address, setAddress] = useState("");
  const inputMnemonic = useRef(null);
  const inputPassword = useRef(null);
  const [AESKey, setAESKey] = useState(null);
  const [encryptedMessage, setEncryptedMessage] = useState(null);
  const [decryptedMessage, setDecryptedMessage] = useState(null);
  const [LCDecryptedMessage, setLCDecryptedMessage] = useState(null);
  const LCPassword = useRef(null);
  const [balance, setBalance] = useState(0);
  const inputAmount = useRef(null);
  const inputTo = useRef(null);
  const [id, setId] = useState([]);
  const [tokenBalance, setTokenBalance] = useState(0);
  const inputTokenAmount = useRef(null);
  const inputTokenTo = useRef(null);
  const inputVoucherPassphrase = useRef(null);
  const inputVoucherAmount = useRef(null);
  const inputRedeemUUID = useRef(null);
  const inputRedeemPassphrase = useRef(null);
  const [uuid, setUuid] = useState("");
  const inputPrivateAmount = useRef(null);
  const inputPrivateTo = useRef(null);
  const inputPrivateUSDCAmount = useRef(null);
  const inputPrivateUSDCto = useRef(null);
  const inputSwapAmount = useRef(null);
  const inputSwapUSDCAmount = useRef(null);
  const [wsClient, setWsClient] = useState(null);
  const inputInterval = useRef(null);
  const [currentTicker, setCurrentTicker] = useState(null);
  const inputTestPassword = useRef(null);
  const [testKey, setTestKey] = useState(null);

  useEffect(() => {
    if (!address) return;
    showBalance();
    showTokenBalance();
    balanceListerner();
  }, [address]);

  //Balance Listerner
  const balanceListerner = async () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const pubKey = new PublicKey(address);

    //Remove previous Listeners
    if (id.length > 0) {
      id.forEach((element) => {
        connection.removeAccountChangeListener(element);
      });
    }

    //Listen for Sol Balance
    const Connectionid = connection.onAccountChange(pubKey, (accountInfo) => {
      showBalance();
    });
    setId([...id, Connectionid]);

    //Listen for Token Balance
    const tokenAddress = new PublicKey(
      "F3hocsFVHrdTBG2yEHwnJHAJo4rZfnSwPg8d5nVMNKYE"
    );
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenAddress,
      keypair.publicKey,
      undefined,
      "finalized"
    );

    const TokenConnectionid = connection.onAccountChange(
      tokenAccount.address,
      (accountInfo) => {
        showTokenBalance();
      }
    );
    setId([...id, TokenConnectionid]);
  };

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
    forge.pkcs5.pbkdf2(
      password,
      "Eminence",
      20000,
      24,
      function (err, derivedKey) {
        setAESKey(derivedKey);
      }
    );
  };

  //Encrypt Mnemonic with RSA Public Key
  const encryptMessage = () => {
    let iv = forge.random.getBytesSync(16);

    const message = mnemonic;
    let cipher = forge.cipher.createCipher("AES-CBC", AESKey);
    cipher.start({ iv: iv });
    console.log(forge.util.createBuffer(iv).toHex());
    cipher.update(forge.util.createBuffer(message));
    cipher.finish();
    let encrypted = cipher.output;
    setEncryptedMessage(
      forge.util.createBuffer(iv).toHex() + encrypted.toHex()
    );

    let decipher = forge.cipher.createDecipher("AES-CBC", AESKey);
    decipher.start({
      iv: forge.util.createBuffer(
        Buffer.from(forge.util.createBuffer(iv).toHex(), "hex")
      ),
    });
    decipher.update(
      forge.util.createBuffer(Buffer.from(encrypted.toHex(), "hex"))
    );
    decipher.finish();
    console.log(decipher.output.getBytes());
  };

  //Decrypt Encrypted Mnemonic with RSA Private Key
  const decryptMessage = () => {
    const encrypted = encryptedMessage;
    const iv = forge.util.createBuffer(
      Buffer.from(encrypted.slice(0, 32), "hex")
    );
    const message = forge.util.createBuffer(
      Buffer.from(encrypted.slice(32), "hex")
    );

    let decipher = forge.cipher.createDecipher("AES-CBC", AESKey);
    decipher.start({ iv: iv });
    decipher.update(message);
    decipher.finish();
    setDecryptedMessage(decipher.output.toString());
  };

  //Store Encrypted Mnemonic in localStorage
  const storeInLocalStorage = () => {
    localStorage.setItem("secretPair", encryptedMessage);
  };

  //Get Encrypted Mnemonic from localStorage and Decrypt with RSA Private Key from Password
  const getFromLC_Decrypt = (password) => {
    const encrypted = localStorage.getItem("secretPair");
    const iv = forge.util.createBuffer(
      Buffer.from(encrypted.slice(0, 32), "hex")
    );
    const message = forge.util.createBuffer(
      Buffer.from(encrypted.slice(32), "hex")
    );

    forge.pkcs5.pbkdf2(
      password,
      "Eminence",
      20000,
      24,
      function (err, derivedKey) {
        let decipher = forge.cipher.createDecipher("AES-CBC", derivedKey);
        decipher.start({ iv: iv });
        decipher.update(message);
        decipher.finish();
        setLCDecryptedMessage(decipher.output.toString());
      }
    );
  };

  //Show Solana Balance
  const showBalance = async () => {
    const pubKey = new PublicKey(address);

    const balance = await connection.getBalance(pubKey, "confirmed");
    setBalance(balance / LAMPORTS_PER_SOL);
  };

  //Transfer Sol
  const transfer = async (amount, to) => {
    console.log(amount, to);
    const connection = new Connection("https://api.devnet.solana.com");

    const fromPubKey = new PublicKey(address);
    const toPubKey = new PublicKey(to.toString());

    const amountInLamports = amount * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromPubKey,
        toPubkey: toPubKey,
        lamports: amountInLamports,
      })
    );
    transaction.feePayer = fromPubKey;

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    let txHash = await sendAndConfirmTransaction(connection, transaction, [
      keypair,
    ]);
    console.log(txHash);

    showBalance();
  };

  //Show Token Balance
  const showTokenBalance = async () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const tokenAddress = new PublicKey(
      "F3hocsFVHrdTBG2yEHwnJHAJo4rZfnSwPg8d5nVMNKYE"
    );
    const owner = new PublicKey(address);

    const accountInfo = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenAddress,
      owner,
      undefined,
      "finalized"
    );

    setTokenBalance(
      accountInfo ? Number(accountInfo.amount) / Math.pow(10, 6) : 0
    );
  };

  //Transfer Token
  const transferToken = async (amount, to) => {
    const tokenAddress = new PublicKey(
      "F3hocsFVHrdTBG2yEHwnJHAJo4rZfnSwPg8d5nVMNKYE"
    );

    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const toWallet = new PublicKey(to.toString());

    const fromWallet = new PublicKey(address);

    const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenAddress,
      fromWallet,
      undefined,
      "finalized"
    );

    const toTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      tokenAddress,
      toWallet
    );

    const amountInLamports = amount * Math.pow(10, 6);

    const signature = await tokenTransfer(
      connection,
      keypair,
      fromTokenAccount.address,
      toTokenAccount.address,
      fromWallet,
      amountInLamports
    );

    console.log(signature);

    showTokenBalance();
  };

  //Generate Voucher
  const generateVoucher = async (passphrase, amount) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    const wallet = new Wallet(keypair);

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });

    const program = new Program(
      IDL,
      "AFDNGbaMr2SqHKZnhXSTkbVB2d6npfxQdFFthrzsD7KN",
      provider
    );

    let len = 10;
    let pattern = "EminenceVoucher";

    const uid = randomId(len, pattern);

    const [voucherPda] = findProgramAddressSync(
      [
        utils.bytes.utf8.encode("EMINENCE_VOUCHER"),
        utils.bytes.utf8.encode(uid),
        utils.bytes.utf8.encode(passphrase),
      ],
      program.programId
    );

    console.log(voucherPda.toString());

    const amountBN = new BN(amount * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .generateVoucher(uid, passphrase, amountBN)
      .accounts({
        authority: keypair.publicKey,
        voucher: voucherPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log(uid);
    setUuid(uid);
    console.log(passphrase);
    console.log(tx);
    showBalance();
  };

  //Redeem Voucher
  const redeemVoucher = async (uuid, passphrase) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));
    const wallet = new Wallet(keypair);

    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "processed",
    });

    const program = new Program(
      IDL,
      "AFDNGbaMr2SqHKZnhXSTkbVB2d6npfxQdFFthrzsD7KN",
      provider
    );

    const [voucherPda] = findProgramAddressSync(
      [
        utils.bytes.utf8.encode("EMINENCE_VOUCHER"),
        utils.bytes.utf8.encode(uuid),
        utils.bytes.utf8.encode(passphrase),
      ],
      program.programId
    );

    const tx = await program.methods
      .redeemVoucher(uuid, passphrase)
      .accounts({
        authority: keypair.publicKey,
        voucher: voucherPda,
      })
      .rpc();

    console.log(uuid);
    console.log(passphrase);
    console.log(tx);
    showBalance();
  };

  //Transfer Private
  const transferPrivate = async (amount, to) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const ElusivSeed = await sign(
      Buffer.from(SEED_MESSAGE, "utf-8"),
      keypair.secretKey.slice(0, 32)
    );

    const elusiv = await Elusiv.getElusivInstance(
      ElusivSeed,
      keypair.publicKey,
      connection,
      "devnet"
    );

    const topupTxData = await elusiv.buildTopUpTx(
      amount * LAMPORTS_PER_SOL,
      "LAMPORTS"
    );

    topupTxData.tx.sign(keypair);

    const topupSig = await elusiv.sendElusivTx(topupTxData);

    console.log(topupSig);

    const privateBalance = await elusiv.getLatestPrivateBalance("LAMPORTS");
    console.log(`Current private balance: ${privateBalance}`);

    const recipient = new PublicKey(to);
    const estimatedFee = await elusiv.estimateSendFee({
      recipient,
      amount: Number(privateBalance),
      tokenType: "LAMPORTS",
    });
    console.log(estimatedFee);
    const sendTx = await elusiv.buildSendTx(
      Number(privateBalance) - Number(estimatedFee.txFee),
      recipient,
      "LAMPORTS"
    );
    const sendSig = await elusiv.sendElusivTx(sendTx);

    console.log(
      `Performed topup with sig ${topupSig.signature} and send with sig ${sendSig.signature}`
    );
  };

  const transferPrivateUSDC = async (amount, to) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const ElusivSeed = sign(
      Buffer.from(SEED_MESSAGE, "utf-8"),
      keypair.secretKey.slice(0, 32)
    );

    const elusiv = await Elusiv.getElusivInstance(
      ElusivSeed,
      keypair.publicKey,
      connection,
      "devnet"
    );

    const topupTx = await elusiv.buildTopUpTx(amount * Math.pow(10, 6), "USDC");

    topupTx.tx.partialSign(keypair);

    const sig = await elusiv.sendElusivTx(topupTx);

    console.log(sig);

    const privateBalance = await elusiv.getLatestPrivateBalance("USDC");

    console.log(privateBalance);

    const recipient = new PublicKey(to);

    const estimatedFee = await elusiv.estimateSendFee({
      recipient,
      amount: Number(privateBalance),
      tokenType: "USDC",
    });

    const sendTx = await elusiv.buildSendTx(
      Number(privateBalance) - Number(estimatedFee.txFee),
      recipient,
      "USDC"
    );
    const sendSig = await elusiv.sendElusivTx(sendTx);

    console.log(sendSig.signature);
  };

  const airdropUSDC = async () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const usdcMint = getMintAccount("USDC", "devnet");
    console.log(usdcMint.toString());

    const ataAcc = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      usdcMint,
      keypair.publicKey,
      undefined,
      "finalized"
    );

    const airdropSig = await airdropToken(
      "USDC",
      LAMPORTS_PER_SOL,
      ataAcc.address
    );

    console.log(airdropSig);
  };

  const swapJupiter = async (amount) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const wallet = new MyWallet(keypair);

    const data = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=${
          amount * LAMPORTS_PER_SOL
        }&slippageBps=50`
      )
    ).json();
    console.log(data);

    const transaction = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: data,
          userPublicKey: wallet.publicKey.toString(),
          wrapUnwrapSOL: true,
        }),
      })
    ).json();

    const { swapTransaction } = transaction;

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let tx = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(tx);

    tx.sign([wallet.payer]);

    const rawTransaction = tx.serialize();
    const txId = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txId,
    });
  };

  const swapUSDC = async (amount) => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const wallet = new MyWallet(keypair);

    const data = await (
      await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&outputMint=So11111111111111111111111111111111111111112&amount=${
          amount * Math.pow(10, 6)
        }&slippageBps=50`
      )
    ).json();

    const transaction = await (
      await fetch("https://quote-api.jup.ag/v6/swap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteResponse: data,
          userPublicKey: wallet.publicKey.toString(),
          wrapUnwrapSOL: true,
        }),
      })
    ).json();

    const { swapTransaction } = transaction;

    const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
    let tx = VersionedTransaction.deserialize(swapTransactionBuf);
    console.log(tx);

    tx.sign([wallet.payer]);

    const rawTransaction = tx.serialize();
    const txId = await connection.sendRawTransaction(rawTransaction, {
      skipPreflight: true,
      maxRetries: 2,
    });

    const latestBlockHash = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: txId,
    });
  };

  const binanceFetchHistory = async (interval) => {
    const price = await (
      await fetch("https://api.binance.com/api/v3/ticker/price?symbol=SOLUSDT")
    ).json();

    console.log(price);

    if (wsClient) wsClient.close();

    const client = new WebSocket("wss://ws-api.binance.com:443/ws-api/v3");

    client.onopen = function () {
      console.log("WebSocket Client Connected");
      client.send(
        JSON.stringify({
          id: "1dbbeb56-8eea-466a-8f6e-86bdcfa2fc0b",
          method: "klines",
          params: {
            symbol: "SOLUSDT",
            interval: interval.toString(),
            limit: 50,
          },
        })
      );
    };

    client.onmessage = function (e) {
      if (typeof e.data === "string") {
        const result = JSON.parse(e.data).result;

        const data = result.map((item) => {
          return {
            ticker: item[1],
          };
        });

        console.log(data);
        setCurrentTicker(data);
      }

      setTimeout(function timeout() {
        client.send(
          JSON.stringify({
            id: "1dbbeb56-8eea-466a-8f6e-86bdcfa2fc0b",
            method: "klines",
            params: {
              symbol: "SOLUSDT",
              interval: interval.toString(),
              limit: 50,
            },
          })
        );
      }, 60000);
    };

    client.onclose = function () {
      console.log("WebSocket Client Closed");
    };

    setWsClient(client);
  };

  const moonpay = async () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    // const moonpaySdk = window.MoonPayWebSdk.init({
    //   flow: "buy",
    //   environment: "sandbox",
    //   variant: "overlay",
    //   params: {
    //     apiKey: "pk_test_123",
    //     theme: "dark",
    //     baseCurrencyCode: "usd",
    //     baseCurrencyAmount: "100",
    //     currencyCode: "sol",
    //     walletAddress: keypair.publicKey.toString(),
    //   },
    //   debug: true,
    // });

    // console.log(moonpaySdk);
    // moonpaySdk.show();

    const onrampInstance = new OnrampWebSDK({
      appId: 1, // replace this with the appID you got during onboarding process
      walletAddress: keypair.publicKey.toString(), // replace with user's wallet address
      flowType: 1, // 1 -> onramp || 2 -> offramp || 3 -> Merchant checkout
      paymentMethod: 2,
      coinCode: "sol",
      fiatAmount: 1000,
      network: "spl",
    });

    onrampInstance.show();
  };

  const testKeyGen = async (password) => {
    console.log(Date.now());
    const derivedKey = forge.pkcs5.pbkdf2(
      Date.now().toString(),
      "Eminence",
      2,
      24
    );
    const nonce = Uint8Array.from(Buffer.from(derivedKey, "binary"));
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const keys = nacl.box.keyPair.fromSecretKey(keypair.secretKey.slice(0, 32));
    const utf8Encoder = new TextEncoder();
    const message = utf8Encoder.encode("My Name is Anoy Roy Chowdhury");
    const signature = nacl.sign.detached(
      utf8Encoder.encode(
        "Welcome to Eminence Wallet. Sign this message to verify your identity."
      ),
      keypair.secretKey
    );
    console.log(bs58.encode(signature));
    const encrypted = nacl.sealedbox(message, nonce, keys.publicKey);

    const decrypted = nacl.sealedbox.open(
      encrypted,
      nonce,
      keypair._keypair.secretKey.slice(0, 32)
    );

    const decoder = new TextDecoder();
    console.log(decoder.decode(decrypted));
  };

  const sign = () => {
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    const keypair = Keypair.fromSeed(seed.slice(0, 32));

    const message =
      "Welcome to Eminence Wallet. Sign this message to verify your identity.";

    const signature = nacl.sign.detached(
      Buffer.from(message, "utf-8"),
      keypair.secretKey
    );

    console.log(bs58.encode(signature));
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
        Create AES Key
      </button>
      <h1 className="text-center">{AESKey}</h1>

      {/* Encrypt Mnemonic with RSA Public key */}
      <button
        onClick={encryptMessage}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Encrypt
      </button>
      <h1 className="text-center">{encryptedMessage}</h1>

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

      {/* Show Solana Balance */}
      <button
        onClick={showBalance}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Show Balance
      </button>
      <h1 className="text-center">{balance} SOL</h1>

      {/* Transfer Sol */}
      <input
        ref={inputTo}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="To"
      ></input>
      <input
        ref={inputAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputAmount.current.value &&
            inputAmount.current.value.length > 0 &&
            inputTo.current.value &&
            inputTo.current.value.length > 0
          )
            await transfer(inputAmount.current.value, inputTo.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Transfer
      </button>

      {/* Show Token Balance */}
      <button
        onClick={showTokenBalance}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Show Balance
      </button>
      <h1 className="text-center">{tokenBalance} USDC-Dev</h1>

      {/* Transfer Token */}
      <input
        ref={inputTokenTo}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="To"
      ></input>
      <input
        ref={inputTokenAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputTokenAmount.current.value &&
            inputTokenAmount.current.value.length > 0 &&
            inputTokenTo.current.value &&
            inputTokenTo.current.value.length > 0
          )
            await transferToken(
              inputTokenAmount.current.value,
              inputTokenTo.current.value
            );
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Transfer Token
      </button>

      {/* Generate Voucher */}
      <input
        ref={inputVoucherPassphrase}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Passphrase"
      ></input>
      <input
        ref={inputVoucherAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputVoucherPassphrase.current.value &&
            inputVoucherPassphrase.current.value.length > 0 &&
            inputVoucherAmount.current.value &&
            inputVoucherAmount.current.value.length > 0
          )
            await generateVoucher(
              inputVoucherPassphrase.current.value,
              inputVoucherAmount.current.value
            );
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Generate Voucher
      </button>
      <h1 className="text-center">{uuid}</h1>

      {/* Redeem Voucher */}
      <input
        ref={inputRedeemUUID}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="UUID"
      ></input>
      <input
        ref={inputRedeemPassphrase}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Passphrase"
      ></input>
      <button
        onClick={async () => {
          if (
            inputRedeemUUID.current.value &&
            inputRedeemUUID.current.value.length > 0 &&
            inputRedeemPassphrase.current.value &&
            inputRedeemPassphrase.current.value.length > 0
          )
            await redeemVoucher(
              inputRedeemUUID.current.value,
              inputRedeemPassphrase.current.value
            );
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Redeem Voucher
      </button>

      {/* Transfer Private */}
      <input
        ref={inputPrivateTo}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="To"
      ></input>
      <input
        ref={inputPrivateAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputPrivateAmount.current.value &&
            inputPrivateAmount.current.value.length > 0 &&
            inputPrivateTo.current.value &&
            inputPrivateTo.current.value.length > 0
          )
            await transferPrivate(
              inputPrivateAmount.current.value,
              inputPrivateTo.current.value
            );
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Transfer Private
      </button>

      {/* Transfer Private USDC */}
      <input
        ref={inputPrivateUSDCto}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="To"
      ></input>
      <input
        ref={inputPrivateUSDCAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputPrivateUSDCAmount.current.value &&
            inputPrivateUSDCAmount.current.value.length > 0 &&
            inputPrivateUSDCto.current.value &&
            inputPrivateUSDCto.current.value.length > 0
          )
            await transferPrivateUSDC(
              inputPrivateUSDCAmount.current.value,
              inputPrivateUSDCto.current.value
            );
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Transfer Private USDC
      </button>

      {/* Airdrop USDC */}
      <button
        onClick={async () => {
          await airdropUSDC();
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Airdrop USDC
      </button>

      {/* Swap */}
      <input
        ref={inputSwapAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount"
      ></input>
      <button
        onClick={async () => {
          if (
            inputSwapAmount.current.value &&
            inputSwapAmount.current.value.length > 0
          )
            await swapJupiter(inputSwapAmount.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Swap
      </button>

      {/* Swap USDC */}
      <input
        ref={inputSwapUSDCAmount}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Amount USDC"
      ></input>
      <button
        onClick={async () => {
          if (
            inputSwapUSDCAmount.current.value &&
            inputSwapUSDCAmount.current.value.length > 0
          )
            await swapUSDC(inputSwapUSDCAmount.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Swap USDC
      </button>

      {/* Binance Fetch History */}
      <input
        ref={inputInterval}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Interval"
      ></input>
      <button
        onClick={async () => {
          if (
            inputInterval.current.value &&
            inputInterval.current.value.length > 0
          )
            await binanceFetchHistory(inputInterval.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Binance Fetch History
      </button>

      {currentTicker && currentTicker.length > 0 && (
        <AreaChart
          width={500}
          height={200}
          data={currentTicker}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <YAxis domain={["datamin", "datamax"]} hide />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="ticker"
            stroke="#49E9FF"
            fill="#40FF8D"
          />
        </AreaChart>
      )}

      {/* Moonpay */}
      <button
        onClick={async () => {
          await moonpay();
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Moonpay
      </button>

      {/* Test KeyGen */}
      <input
        ref={inputTestPassword}
        className="rounded-full p-4 text-black w-[50%]"
        placeholder="Password"
      ></input>
      <button
        onClick={async () => {
          if (
            inputTestPassword.current.value &&
            inputTestPassword.current.value.length > 0
          )
            await testKeyGen(inputTestPassword.current.value);
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Test KeyGen
      </button>
      <h1>{testKey}</h1>

      {/* Sign */}
      <button
        onClick={async () => {
          await sign();
        }}
        className="rounded-full p-4 bg-red-500 text-white"
      >
        Sign
      </button>
    </main>
  );
}
