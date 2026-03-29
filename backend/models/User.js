const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profile: {
    height: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    targetWeight: { type: Number, default: 0 },
    age: { type: Number, default: 0 },
    gender: { type: String, enum: ['male', 'female', ''], default: '' },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'sedentary'
    },
    menstrualCycle: {
      isTracking: { type: Boolean, default: false },
      lastPeriod: { type: Date },
      cycleLength: { type: Number, default: 28 },
      periodLength: { type: Number, default: 5 }
    }
  },
  dailyGoals: {
    calories: { type: Number, default: 1500 },
    water: { type: Number, default: 2000 },
    protein: { type: Number, default: 60 },
    carbs: { type: Number, default: 200 },
    fat: { type: Number, default: 50 }
  },
  achievements: [{
    id: String,
    name: String,
    description: String,
    icon: String,
    unlockedAt: { type: Date, default: Date.now }
  }],
  points: {
    type: Number,
    default: 0
  },
  streakDays: {
    type: Number,
    default: 0
  },
  lastCheckIn: {
    type: Date
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getBMI = function() {
  if (!this.profile.height || !this.profile.weight) return null;
  const heightInMeters = this.profile.height / 100;
  return (this.profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
};

userSchema.methods.getBMR = function() {
  const { weight, height, age, gender } = this.profile;
  if (!weight || !height || !age) return null;
  if (gender === 'male') {
    return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
  }
  return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
};

userSchema.methods.getDailyCalorieNeeds = function() {
  const bmr = this.getBMR();
  if (!bmr) return null;
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return Math.round(bmr * (multipliers[this.profile.activityLevel] || 1.2));
};

module.exports = mongoose.model('User', userSchema);
