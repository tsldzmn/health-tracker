const mongoose = require('mongoose');

const foodEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  foods: [{
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    unit: { type: String, default: 'g' },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    imageUrl: { type: String },
    recognizedByAI: { type: Boolean, default: false }
  }],
  totalCalories: {
    type: Number,
    default: 0
  },
  totalProtein: {
    type: Number,
    default: 0
  },
  totalCarbs: {
    type: Number,
    default: 0
  },
  totalFat: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

foodEntrySchema.pre('save', function(next) {
  this.totalCalories = this.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
  this.totalProtein = this.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
  this.totalCarbs = this.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  this.totalFat = this.foods.reduce((sum, f) => sum + (f.fat || 0), 0);
  next();
});

foodEntrySchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('FoodEntry', foodEntrySchema);
