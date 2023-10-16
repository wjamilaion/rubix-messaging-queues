export const toBuffer = (message: Record<string, any>) => {
  return Buffer.from(JSON.stringify(message));
};

export const toObject = (message: Buffer) => {
  return JSON.parse(message.toString('utf-8'));
};
