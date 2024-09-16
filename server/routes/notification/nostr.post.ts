import { defineEventHandler } from "h3";
import { SimplePool } from "nostr-tools";
import { nip19, nip04 } from "nostr-tools";
import {
  finalizeEvent,
  getPublicKey,
  generateSecretKey,
} from "nostr-tools/pure";

const RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.0xchat.com",
  "wss://relay.siamstr.com",
];

const secretKey = generateSecretKey();

export default defineEventHandler(async () => {
  const pool = new SimplePool();

  const recipientPubkeys = [
    "npub1k4waaqmsyx5ag7jjdc4jde6xedxjqvx2f68j7q86a0gfvafnkrcst39ch9",
  ].map((pubkey) => nip19.decode(pubkey).data as string);

  const content = "test";

  try {
    const relayConnections = await Promise.all(
      RELAYS.map((relay) => pool.ensureRelay(relay))
    );

    for (const recipientPubkey of recipientPubkeys) {
      const encryptedContent = await nip04.encrypt(
        secretKey,
        recipientPubkey,
        content
      );

      const eventTemplate = {
        kind: 4,
        created_at: Math.floor(Date.now() / 1000),
        tags: [["p", recipientPubkey]],
        content: encryptedContent,
        pubkey: getPublicKey(secretKey),
      };

      const signedEvent = finalizeEvent(eventTemplate, secretKey);

      const pubs = relayConnections.map((relay) => relay.publish(signedEvent));
      const failedRelays = [];
      await Promise.all(
        pubs.map(async (pub, i) => {
          try {
            await pub;
          } catch (err) {
            failedRelays.push(RELAYS[i]);
          }
        })
      );
      console.log("Published private message to Nostr!");

      if (failedRelays.length > 0) {
        throw new Error(`Failed relays: ${failedRelays.join(", ")}`);
      }

      return {
        success: true,
        message: "Form submitted and private notification sent",
      };
    }
  } catch (error) {
    console.error(
      "Error sending private message to Nostr:",
      error,
      JSON.stringify(error),
      error instanceof Error ? `Failed relays: ${error.message}` : ""
    );
    return {
      success: false,
      message: "Form submitted but private notification failed",
    };
  } finally {
    await pool.close(RELAYS);
  }
});
