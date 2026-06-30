import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { Feedback, FeedbackDocument } from './schemas/feedback.schema';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name)
    private feedbackModel: Model<FeedbackDocument>,
  ) {}

  async create(dto: CreateFeedbackDto) {
    const hasRating = typeof dto.rating === 'number' && dto.rating > 0;
    const hasComment = !!dto.comment && dto.comment.trim().length > 0;

    if (!hasRating && !hasComment) {
      throw new BadRequestException(
        'Please provide a rating or a comment before submitting feedback',
      );
    }

    return this.feedbackModel.create({
      ...dto,
      rating: dto.rating ?? 0,
      comment: dto.comment?.trim(),
    });
  }

  findAll() {
    return this.feedbackModel.find().sort({ createdAt: -1 });
  }
}
