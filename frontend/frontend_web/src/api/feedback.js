import api from './axiosInstance';
import { getMyProfile, getPublicProfile } from './profileService';

// Matches FeedbackController:
//   POST /feedback -> FeedbackResponse
//   GET  /feedback/{targetUserId}/{skill} -> FeedbackDocument[]

export const submitFeedback = async ({ targetUserId, skill, stars, comment, chatId, scheduledEventId }) => {
  try {
    const response = await api.post('/feedback', {
      targetUserId,
      skill,
      stars,
      comment,
      chatId,
      scheduledEventId,
    });
    return response.data; // FeedbackResponse
  } catch (error) {
    console.error('Error submitting feedback:', error.response?.data || error.message);
    throw error;
  }
};

export const fetchFeedbackForUserSkill = async (targetUserId, skill) => {
  try {
    const response = await api.get(`/feedback/${targetUserId}/${skill}`);
    return response.data; // FeedbackDocument[]
  } catch (error) {
    console.error('Error fetching feedback:', error.response?.data || error.message);
    throw error;
  }
};

const COMMON_SKILLS = ["Communication", "Technical knowledge", "Punctuality", "Helpfulness", "Overall session"];


export const fetchMyRecentFeedback = async () => {
  const me = await getMyProfile();
  const myUserId = me.id; // ProfileResponse uses "id", not "userId" — confirmed from the real DTO

  const ownSkills = (me.skillsProficient || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const skillsToQuery = Array.from(new Set([...ownSkills, ...COMMON_SKILLS]));

  const results = await Promise.all(
    skillsToQuery.map((skill) => fetchFeedbackForUserSkill(myUserId, skill).catch(() => []))
  );

  const allFeedback = results.flat();

  const uniqueReviewerIds = Array.from(new Set(allFeedback.map((f) => f.fromUserId)));
  const profiles = await Promise.all(
    uniqueReviewerIds.map((id) => getPublicProfile(id).catch(() => null))
  );
  const profileMap = Object.fromEntries(uniqueReviewerIds.map((id, i) => [id, profiles[i]]));

  return allFeedback
    .map((f) => ({
      ...f,
      reviewerName: profileMap[f.fromUserId]?.name || "Someone",
      reviewerPicture: profileMap[f.fromUserId]?.picture || null,
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};