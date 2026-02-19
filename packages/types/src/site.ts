export interface Site {
  id: string;
  userId: string;
  domain: string;
  ownershipVerified: boolean;
  verificationToken: string | null;
  createdAt: string;
  updatedAt: string;
}
