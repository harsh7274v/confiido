import mongoose from 'mongoose';
import User from '../models/User';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/micah/svg';
const INITIALS_REGEX = /dicebear.*initials/;

async function updateAvatars() {
  await mongoose.connect(process.env.MONGO_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  console.log('Avatar field has been removed from User model. No updates needed.');

  console.log('Avatar update complete.');
  await mongoose.disconnect();
}

updateAvatars().catch(err => {
  console.error('Error updating avatars:', err);
  process.exit(1);
});
