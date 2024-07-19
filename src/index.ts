import { Telegraf } from "telegraf";
import dotenv from "dotenv";
import { beginCell, fromNano, toNano } from "ton-core";
import qs from "qs";
import { message } from "telegraf/filters";
import { TonClient, Address } from "ton";

dotenv.config();
const bot = new Telegraf(process.env.TG_BOT_TOKEN!);

const tonHubUrl = "https://app.tonkeeper.com";
const tonKeeperUrl = "https://app.tonkeeper.com";

const clientEndpoint = "https://toncenter.com/api/v2/jsonRPC";
const clientTestnetEndpoint = "https://testnet.toncenter.com/api/v2/jsonRPC";

const tonclient = new TonClient({
  endpoint: process.env.Use_Testnet ? clientTestnetEndpoint : clientEndpoint,
});
const address = Address.parse(process.env.SC_ADDRESS!);

bot.start((ctx) =>
  ctx.reply("Welcome to our address-getter app!", {
    reply_markup: {
      keyboard: [
        ["Get balance"],
        ["Increment by 5"],
        ["Deposit 0.5 TON"],
        ["Withdraw 1 TON"],
      ],
    },
  })
);

const getBalance = async () => {
  const { stack } = await tonclient.runMethod(address, "balance");
  return stack.readNumber();
};

bot.hears("Get balance", async (ctx) => {
  const balance = await getBalance();
  ctx.reply(`Balance: ${fromNano(balance).toString()} TON`);
});

bot.hears("Increment by 5", (ctx) => {
  const msg_body = beginCell()
    .storeUint(1, 32) // OP code
    .storeUint(5, 32)
    .endCell();

  let link = `${tonKeeperUrl}/transfer/${process.env.SC_ADDRESS}?${qs.stringify(
    {
      text: "Increment counter by 5",
      amount: toNano("0.05").toString(10),
      bin: msg_body.toBoc({ idx: false }).toString("base64"),
    }
  )}`;

  ctx.reply("To increment counter by 5, please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.hears("Deposit 0.5 TON", (ctx) => {
  const msg_body = beginCell()
    .storeUint(2, 32) // OP code
    .endCell();

  let link = `${tonKeeperUrl}/transfer/${process.env.SC_ADDRESS}?${qs.stringify(
    {
      text: "Deposit 1 TON",
      amount: toNano("0.5").toString(10),
      bin: msg_body.toBoc({ idx: false }).toString("base64"),
    }
  )}`;

  ctx.reply("To deposit 0.5 TON please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.hears("Withdraw 1 TON", (ctx) => {
  const msg_body = beginCell()
    .storeUint(3, 32)
    .storeCoins(toNano(`1`))
    .endCell();

  let link = `${tonKeeperUrl}/transfer/${process.env.SC_ADDRESS}?${qs.stringify(
    {
      text: "Withdraw 1 TON",
      amount: toNano("0.05").toString(10),
      bin: msg_body.toBoc({ idx: false }).toString("base64"),
    }
  )}`;

  ctx.reply("To withdraw 1 TON please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.on(message("web_app_data"), (ctx) => ctx.reply("ok"));

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
