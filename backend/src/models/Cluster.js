import mongoose from 'mongoose';

const clusterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
      },
    ],
    image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export const Cluster = mongoose.model('Cluster', clusterSchema);
