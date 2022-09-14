import AppConfig from '@root/config/AppConfig';
import aes from 'js-crypto-aes'; // for npm

const CryptoData = {
  async encryptData(props: string) {
    // Updating text
    let ui8Arr = await aes.encrypt(Buffer.from(props), Buffer.from(AppConfig.APP_SECRET), {
      name: 'AES-GCM',
      iv: Buffer.from("5183666c72ee"),
      additionalData: Buffer.from("test"),
      tagLength: 16
    });
    return Buffer.from(ui8Arr).toString("hex");
  },
  async descryptData(props: string) {
    let ui8Arr = await aes.decrypt(Uint8Array.from(Buffer.from(props, "hex")), Buffer.from(AppConfig.APP_SECRET),
      {
        name: 'AES-GCM',
        iv: Buffer.from("5183666c72ee"),
        additionalData: Buffer.from("test"),
        tagLength: 16
      })
    return Buffer.from(ui8Arr).toString();
  }
}

export default CryptoData;