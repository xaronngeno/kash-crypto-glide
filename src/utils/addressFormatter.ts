
export const formatAddress = (address: string | undefined) => {
  if (!address) return '';
  if (address.length <= 10) return address;
  return `${address.substring(0, 8)}...${address.substring(address.length - 4)}`;
};
