import { wishlistRepository } from '../repositories';

export async function getWishlist(userId: string) {
  return wishlistRepository.findOrCreateForUser(userId).then((doc) => doc.populate('medicineIds'));
}

export async function addToWishlist(userId: string, medicineId: string) {
  return wishlistRepository.addMedicine(userId, medicineId);
}

export async function removeFromWishlist(userId: string, medicineId: string) {
  return wishlistRepository.removeMedicine(userId, medicineId);
}
