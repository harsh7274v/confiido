import mongoose from 'mongoose';
import User from '../models/User';

const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/micah/svg';
const INITIALS_REGEX = /dicebear.*initials/;

async function updateAvatars() {
  await mongoose.connect(process.env.MONGO_URI || '', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  } as any);

  const users = await User.find({
    $or: [
      { avatar: { $exists: false } },
      { avatar: null },
      { avatar: '' },
      { avatar: { $regex: INITIALS_REGEX } }
    ]
  });

  for (const user of users) {
    user.avatar = DEFAULT_AVATAR;
    await user.save();
    console.log(`Updated avatar for user: ${user.email}`);
  }

  console.log('Avatar update complete.');
  await mongoose.disconnect();
}

updateAvatars().catch(err => {
  console.error('Error updating avatars:', err);
  process.exit(1);
});
