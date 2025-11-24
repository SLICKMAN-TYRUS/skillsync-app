import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  Alert,
  Image,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api, { studentApi } from '../../services/api';
import { pickFile, MAX_FILE_SIZE } from '../../components/FilePicker';
import ErrorBanner from '../../components/ErrorBanner';
import RoleBadge from '../../components/RoleBadge';
import { fetchUserProfile, saveUserProfile } from '../../services/firestoreAdapter';
import { firebaseAuth } from '../../services/firebaseConfig';

const BRAND_BLUE = '#2B75F6';
const BRAND_DARK = '#0F172A';
const LIGHT_BORDER = '#E2E8F0';
import { ensureTestAuth } from '../../services/devAuth';

const DEFAULT_STATS = {
  applications: 0,
  accepted: 0,
  completed: 0,
  provided_gigs: 0,
  notifications_unread: 0,
  average_rating: 0,
};

const BACKEND_UPDATABLE_FIELDS = new Set(['name', 'bio', 'location', 'profile_photo']);

const DEV_TEST_AUTH_ENABLED =
  (typeof __DEV__ !== 'undefined' && __DEV__) || process?.env?.ALLOW_DEV_TOKENS === 'true';

const SETTINGS_DEFINITION = [
  { key: 'bio', icon: 'chatbubble-ellipses-outline', label: 'Bio' },
  { key: 'education', icon: 'school-outline', label: 'Education' },
  { key: 'experience', icon: 'briefcase-outline', label: 'Experience' },
  { key: 'skills', icon: 'sparkles-outline', label: 'Skills' },
  { key: 'languages', icon: 'language-outline', label: 'Languages' },
  { key: 'availability', icon: 'time-outline', label: 'Availability' },
  { key: 'contact', icon: 'call-outline', label: 'Contact' },
  { key: 'portfolio', icon: 'link-outline', label: 'Portfolio' },
  { key: 'social', icon: 'share-social-outline', label: 'Social Links' },
  { key: 'achievements', icon: 'trophy-outline', label: 'Achievements' },
  { key: 'certifications', icon: 'ribbon-outline', label: 'Certifications' },
];

const normalizeList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
};

const resolveList = (...candidates) => {
  for (const candidate of candidates) {
    const normalized = normalizeList(candidate);
    if (normalized.length) {
      return normalized;
    }
  }
  return [];
};

const toTitleCaseStatus = (status) => {
  const lower = (status || '').toLowerCase();
  if (!lower) return '';
  return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const getStatusColor = (status) => {
  const value = (status || '').toLowerCase();
  switch (value) {
    case 'accepted':
    case 'approved':
    case 'selected':
      return '#4CAF50';
    case 'completed':
      return '#2563EB';
    case 'pending':
    case 'submitted':
      return '#F59E0B';
    case 'rejected':
    case 'declined':
      return '#F87171';
    case 'withdrawn':
      return '#6B7280';
    default:
      return '#2B75F6';
  }
};

const sanitizeImageUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const buildDemoProfile = () => ({
  id: 'demo-student',
  uid: 'demo-student',
  name: 'Alex Rivera',
  email: 'alex.rivera@alueducation.com',
  role: 'student',
  avatar: 'https://avatars.dicebear.com/api/initials/Alex%20Rivera.svg',
  profile_photo: null,
  location: 'Kigali, Rwanda',
  bio: 'Second-year Software Engineering student exploring how data and design can unlock social impact startups.',
  phone: '+250 700 000 001',
  availability: 'Weekdays after 4pm / Weekends All Day',
  experience: 'Led a four-person product pod building a logistics dashboard for the Kigali Farmers Cooperative.',
  education: 'BSc Software Engineering · ALU (Class of 2026)',
  portfolioUrl: 'https://alexrivera.dev',
  resumeUrl: 'https://example.com/resume/alex-rivera.pdf',
  stats: {
    ...DEFAULT_STATS,
    applications: 6,
    accepted: 2,
    completed: 1,
    provided_gigs: 0,
    notifications_unread: 3,
    average_rating: 4.7,
  },
  schoolDetails: {
    schoolName: 'African Leadership University',
    program: 'Software Engineering',
    yearOfStudy: 'Year 2',
    studentIdNumber: 'ALU-2026-0912',
    status: 'verified',
  },
  socialLinks: {
    linkedIn: 'https://linkedin.com/in/alex-rivera',
    github: 'https://github.com/alex-rivera',
    website: 'https://alexrivera.dev',
  },
  skills: ['UI/UX Research', 'React Native', 'Data Storytelling', 'Stakeholder Management'],
  languages: ['English', 'Kinyarwanda', 'French'],
  achievements: ['Winner - ALU Innovation Sprint 2025', 'Top 5 - Kigali Youth Hackathon'],
  certifications: ['Google UX Design Certificate', 'AWS Certified Cloud Practitioner'],
  universityIdUrl: 'https://example.com/ids/alex-rivera-id.pdf',
  completedTasks: [
    {
      id: 'task-1',
      title: 'Redesigned Kigali Farmers Logistics Dashboard',
      completedAt: '2025-02-18T10:00:00Z',
      summary:
        'Improved inventory tracking and delivery forecasting for the cooperative with stakeholder workshops and rapid prototyping.',
    },
    {
      id: 'task-2',
      title: 'Analyzed Student Housing Satisfaction Survey',
      completedAt: '2025-03-02T15:30:00Z',
      summary:
        'Cleaned and visualised 280 survey responses in Looker Studio, highlighting three actionable interventions for campus housing.',
    },
    {
      id: 'task-3',
      title: 'Mentored ALU Freshers on Git Workflows',
      completedAt: '2025-03-12T12:15:00Z',
      summary:
        'Facilitated a hands-on clinic covering branching, pull requests, and peer reviews to accelerate group project delivery.',
    },
  ],
});

const buildDemoApplications = () => [
  {
    id: 'demo-app-1',
    status: 'completed',
    applied_at: '2025-01-24T09:10:00Z',
    gig_id: 'demo-gig-1',
    gig: {
      id: 'demo-gig-1',
      title: 'Marketing Analytics Fellow',
    },
  },
  {
    id: 'demo-app-2',
    status: 'submitted',
    applied_at: '2025-02-16T14:30:00Z',
    gig_id: 'demo-gig-2',
    gig: {
      id: 'demo-gig-2',
      title: 'Product Research Assistant',
    },
  },
  {
    id: 'demo-app-3',
    status: 'accepted',
    applied_at: '2025-03-08T11:05:00Z',
    gig_id: 'demo-gig-3',
    gig: {
      id: 'demo-gig-3',
      title: 'Community Design Sprint Facilitator',
    },
  },
];

const formatApplications = (apps = []) => {
  const mapped = apps.map((app) => {
    const rawStatus = (app.status || 'pending').toLowerCase();
    const appliedIso = app.applied_at || app.created_at || app.timestamp || null;
    return {
      id: app.id,
      gigId: app.gig_id || app.gigId || app.gig?.id,
      title: app.gig?.title || app.gigTitle || app.title || 'Gig Application',
      rawStatus,
      status: toTitleCaseStatus(rawStatus),
      statusColor: getStatusColor(rawStatus),
      appliedAt: appliedIso,
    };
  });

  mapped.sort((a, b) => {
    if (!a.appliedAt && !b.appliedAt) return 0;
    if (!a.appliedAt) return 1;
    if (!b.appliedAt) return -1;
    return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
  });

  return mapped.slice(0, 3);
};

const mergeProfileState = (prev, updates) => {
  const next = { ...(prev || {}) };
  Object.entries(updates || {}).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = { ...(prev?.[key] || {}), ...value };
    } else {
      next[key] = value;
    }
  });
  return next;
};

const mergeProfiles = (apiProfile, firestoreProfile) => {
  if (!apiProfile && !firestoreProfile) {
    return null;
  }

  const raw = firestoreProfile?._raw || {};
  const stats = {
    ...DEFAULT_STATS,
    ...(raw.stats || {}),
    ...(firestoreProfile?.stats || {}),
    ...(apiProfile?.stats || {}),
  };

  const resumeUrl =
    apiProfile?.resumeUrl ||
    apiProfile?.resume_url ||
    raw.resumeUrl ||
    raw.resumeURL ||
    firestoreProfile?.resumeUrl ||
    '';

  const schoolDetailsSource =
    apiProfile?.schoolDetails ||
    firestoreProfile?._raw?.schoolDetails ||
    raw.schoolDetails ||
    {};

  const schoolDetails = {
    schoolName: schoolDetailsSource.schoolName || raw.schoolName || '',
    program: schoolDetailsSource.program || schoolDetailsSource.course || raw.program || '',
    yearOfStudy:
      schoolDetailsSource.yearOfStudy ||
      schoolDetailsSource.year ||
      raw.yearOfStudy ||
      raw.yearLevel ||
      '',
    studentIdNumber:
      schoolDetailsSource.studentIdNumber ||
      schoolDetailsSource.studentId ||
      raw.studentIdNumber ||
      raw.studentId ||
      '',
    status: schoolDetailsSource.status || raw.schoolVerificationStatus || '',
  };

  const socialLinksSource =
    apiProfile?.socialLinks || firestoreProfile?._raw?.socialLinks || raw.socialLinks || {};

  const socialLinks = {
    linkedIn: socialLinksSource.linkedIn || raw.linkedIn || '',
    github: socialLinksSource.github || raw.github || '',
    website: socialLinksSource.website || raw.website || raw.portfolioWebsite || '',
  };

  const profilePhoto =
    sanitizeImageUrl(apiProfile?.profile_photo) ||
    sanitizeImageUrl(raw.profile_photo) ||
    sanitizeImageUrl(firestoreProfile?._raw?.profile_photo) ||
    null;

  const avatarUrl =
    sanitizeImageUrl(firestoreProfile?.avatar) ||
    sanitizeImageUrl(raw.avatar) ||
    profilePhoto;

  return {
    id: apiProfile?.id || firestoreProfile?.id || raw.id || null,
    uid: apiProfile?.uid || firestoreProfile?.uid || raw.uid || null,
    name: apiProfile?.name || firestoreProfile?.name || raw.name || 'Student',
    email: apiProfile?.email || firestoreProfile?.email || raw.email || '',
    role: apiProfile?.role || firestoreProfile?.role || raw.role || 'student',
    profile_photo: profilePhoto,
    avatar: avatarUrl,
    location: apiProfile?.location || raw.location || firestoreProfile?.location || '',
    bio: apiProfile?.bio || raw.bio || firestoreProfile?._raw?.bio || '',
    phone: apiProfile?.phone || raw.phone || firestoreProfile?._raw?.phone || '',
    availability: apiProfile?.availability || raw.availability || firestoreProfile?._raw?.availability || '',
    experience: apiProfile?.experience || raw.experience || firestoreProfile?._raw?.experience || '',
    education: apiProfile?.education || raw.education || firestoreProfile?._raw?.education || '',
    portfolioUrl: apiProfile?.portfolioUrl || raw.portfolioUrl || firestoreProfile?._raw?.portfolioUrl || '',
    resumeUrl,
    resume_url: resumeUrl,
    stats,
    schoolDetails,
    socialLinks,
    skills: resolveList(apiProfile?.skills, firestoreProfile?.skills, raw.skills),
    languages: resolveList(apiProfile?.languages, raw.languages, firestoreProfile?._raw?.languages),
    achievements: resolveList(raw.achievements, apiProfile?.achievements),
    certifications: resolveList(raw.certifications, apiProfile?.certifications),
    universityIdUrl:
      sanitizeImageUrl(raw.universityIdUrl) ||
      sanitizeImageUrl(firestoreProfile?._raw?.universityIdUrl) ||
      '',
  };
};

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const isValidResumeFilename = (name) => {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ['.pdf', '.doc', '.docx'].some((ext) => lower.endsWith(ext));
};

const ProfileScreen = ({ navigation }) => {
  const demoProfile = useMemo(() => buildDemoProfile(), []);
  const demoApplicationsRaw = useMemo(() => buildDemoApplications(), []);
  const demoApplications = useMemo(
    () => formatApplications(demoApplicationsRaw),
    [demoApplicationsRaw],
  );

  const [profile, setProfile] = useState(demoProfile);
  const [applications, setApplications] = useState(demoApplications);
  const [refreshing, setRefreshing] = useState(false);
  const completedTasks = profile?.completedTasks || [];
  const [error, setError] = useState('');
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeModalVisible, setResumeModalVisible] = useState(false);
  const [resumeUrlInput, setResumeUrlInput] = useState('');
  const [schoolModalVisible, setSchoolModalVisible] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [studentIdNumber, setStudentIdNumber] = useState('');
  const [program, setProgram] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('');
  const [activeSetting, setActiveSetting] = useState(null);
  const [bioInput, setBioInput] = useState('');
  const [educationInput, setEducationInput] = useState('');
  const [experienceInput, setExperienceInput] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [availabilityInput, setAvailabilityInput] = useState('');
  const [languagesInput, setLanguagesInput] = useState('');
  const [portfolioUrlInput, setPortfolioUrlInput] = useState('');
  const [linkedInInput, setLinkedInInput] = useState('');
  const [githubInput, setGithubInput] = useState('');
  const [websiteInput, setWebsiteInput] = useState('');
  const [achievementsInput, setAchievementsInput] = useState('');
  const [certificationsInput, setCertificationsInput] = useState('');
  const [saving, setSaving] = useState(false);

  const currentUid = useMemo(
    () => firebaseAuth?.currentUser?.uid || profile?.uid || null,
    [profile],
  );

  const applicationStats = useMemo(() => {
    const totals = {
      total: applications.length,
      pending: 0,
      accepted: 0,
      completed: 0,
      rejected: 0,
      withdrawn: 0,
    };
    applications.forEach((app) => {
      const status = (app.rawStatus || '').toLowerCase();
      switch (status) {
        case 'accepted':
        case 'approved':
          totals.accepted += 1;
          break;
        case 'completed':
          totals.completed += 1;
          break;
        case 'rejected':
        case 'declined':
          totals.rejected += 1;
          break;
        case 'withdrawn':
          totals.withdrawn += 1;
          break;
        default:
          totals.pending += 1;
      }
    });
    return totals;
  }, [applications]);

  const applyProfileUpdates = useCallback((updates) => {
    setProfile((prev) => mergeProfileState(prev, updates));
  }, []);

  const persistExtendedProfile = useCallback(
    async (data) => {
      if (!currentUid) {
        throw new Error('Unable to save profile changes without a logged in user');
      }
      await saveUserProfile(currentUid, data);
    },
    [currentUid],
  );

  const updateBackendProfile = useCallback(async (payload) => {
    if (!payload) return;
    const sanitized = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed.length) {
          return;
        }
        sanitized[key] = trimmed;
        return;
      }
      sanitized[key] = value;
    });
    const allowedKeys = Object.keys(sanitized).filter((key) => BACKEND_UPDATABLE_FIELDS.has(key));
    if (!allowedKeys.length) {
      return;
    }
    const body = {};
    allowedKeys.forEach((key) => {
      body[key] = sanitized[key];
    });
    try {
      await studentApi.updateProfile(body);
    } catch (err) {
      try {
        await api.put('/users/profile', body);
      } catch (apiErr) {
        throw apiErr;
      }
    }
  }, []);

  const updateAvailabilityStatus = useCallback(async (value) => {
    if (!value) return;
    try {
      await api.put('/users/availability', { availability_status: value });
    } catch (err) {
      console.error('Failed to update availability status', err);
      throw err;
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setRefreshing(true);
    try {
      if (DEV_TEST_AUTH_ENABLED) {
        await ensureTestAuth('firebase-uid-student1', 'student');
      }

      const [apiData, appsData] = await Promise.all([
        studentApi.getProfile().then((res) => res.data).catch(() => null),
        studentApi.getApplications().then((res) => res.data).catch(() => []),
      ]);

      let firestoreData = null;
      const authUid = firebaseAuth?.currentUser?.uid;
      if (authUid) {
        try {
          firestoreData = await fetchUserProfile(authUid);
        } catch (err) {
          firestoreData = null;
        }
      }
      if (!firestoreData && apiData?.uid) {
        try {
          firestoreData = await fetchUserProfile(apiData.uid);
        } catch (err) {
          firestoreData = null;
        }
      }

      const mergedProfile = mergeProfiles(apiData, firestoreData);
      const profileResult = mergedProfile
        ? mergeProfileState(demoProfile, mergedProfile)
        : demoProfile;

      const completedFromData = mergedProfile?.completedTasks || firestoreData?.completedTasks;
      const enrichedProfile =
        Array.isArray(completedFromData) && completedFromData.length
          ? { ...profileResult, completedTasks: completedFromData }
          : profileResult;

      const normalizedApps = Array.isArray(appsData) ? appsData : appsData?.items || [];
      const formattedApplications = formatApplications(
        mergedProfile ? normalizedApps : demoApplicationsRaw,
      );

      setProfile(enrichedProfile);
      setApplications(formattedApplications);
      setError('');

      if (enrichedProfile?.schoolDetails) {
        setSchoolName(enrichedProfile.schoolDetails.schoolName || '');
        setStudentIdNumber(enrichedProfile.schoolDetails.studentIdNumber || '');
        setProgram(enrichedProfile.schoolDetails.program || '');
        setYearOfStudy(enrichedProfile.schoolDetails.yearOfStudy || '');
      }
    } catch (err) {
      console.error('Error fetching profile', err);
      setProfile(demoProfile);
      setApplications(demoApplications);
      setSchoolName(demoProfile.schoolDetails.schoolName);
      setStudentIdNumber(demoProfile.schoolDetails.studentIdNumber);
      setProgram(demoProfile.schoolDetails.program);
      setYearOfStudy(demoProfile.schoolDetails.yearOfStudy);
      setError('Showing a sample profile while we reconnect to your data.');
    } finally {
      setRefreshing(false);
    }
  }, [demoApplications, demoApplicationsRaw, demoProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const openSchoolModal = () => {
    setError('');
    const details = profile?.schoolDetails || {};
    setSchoolName(details.schoolName || '');
    setStudentIdNumber(details.studentIdNumber || '');
    setProgram(details.program || '');
    setYearOfStudy(details.yearOfStudy || '');
    setSchoolModalVisible(true);
  };

  const openSetting = useCallback((setting) => {
    if (!profile) return;
    setActiveSetting(setting);
    setError('');
    switch (setting) {
      case 'bio':
        setBioInput(profile.bio || '');
        break;
      case 'education':
        setEducationInput(typeof profile.education === 'string' ? profile.education : '');
        break;
      case 'experience':
        setExperienceInput(profile.experience || '');
        break;
      case 'skills':
        setSkillsInput((profile.skills || []).join(', '));
        break;
      case 'contact':
        setContactPhone(profile.phone || '');
        setLocationInput(profile.location || '');
        break;
      case 'availability':
        setAvailabilityInput(profile.availability || '');
        break;
      case 'languages':
        setLanguagesInput((profile.languages || []).join(', '));
        break;
      case 'portfolio':
        setPortfolioUrlInput(profile.portfolioUrl || '');
        break;
      case 'social':
        setLinkedInInput(profile.socialLinks?.linkedIn || '');
        setGithubInput(profile.socialLinks?.github || '');
        setWebsiteInput(profile.socialLinks?.website || '');
        break;
      case 'achievements':
        setAchievementsInput((profile.achievements || []).join('\n'));
        break;
      case 'certifications':
        setCertificationsInput((profile.certifications || []).join('\n'));
        break;
      default:
        break;
    }
  }, [profile]);

  const closeSetting = useCallback(() => setActiveSetting(null), []);

  const handleResumeUpload = useCallback(async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      if (file.size && file.size > MAX_FILE_SIZE) {
        setError('File exceeds 5 MB limit');
        return;
      }
      const name = file.name || file.uri?.split('/')?.pop() || 'resume.pdf';
      if (!isValidResumeFilename(name)) {
        Alert.alert('Invalid file', 'Please upload a PDF or Word document (.pdf, .doc, .docx)');
        return;
      }
      setResumeUploading(true);
      const signedResp = await api.get(`/uploads/signed-url?filename=${encodeURIComponent(name)}`);
      const { uploadUrl, fileUrl } = signedResp.data;
      if (file.file) {
        await fetch(uploadUrl, { method: 'PUT', body: file.file });
      } else if (file.uri) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await fetch(uploadUrl, { method: 'PUT', body: blob });
      }
      await persistExtendedProfile({ resumeUrl: fileUrl });
      applyProfileUpdates({ resumeUrl: fileUrl, resume_url: fileUrl });
      Alert.alert('Success', 'Resume uploaded and saved');
    } catch (err) {
      console.error('Resume upload failed', err);
      setError(err?.message || 'Failed to upload resume');
    } finally {
      setResumeUploading(false);
    }
  }, [applyProfileUpdates, persistExtendedProfile]);

  const submitResumeUrl = async () => {
    const url = resumeUrlInput.trim();
    if (!url || !isValidResumeFilename(url)) {
      Alert.alert('Invalid URL', 'Please enter a link to a PDF or Word document (.pdf, .doc, .docx)');
      return;
    }
    setResumeUploading(true);
    try {
      await persistExtendedProfile({ resumeUrl: url });
      applyProfileUpdates({ resumeUrl: url, resume_url: url });
      setResumeModalVisible(false);
      setResumeUrlInput('');
      Alert.alert('Saved', 'Resume link saved to your profile');
    } catch (err) {
      console.error('Saving resume URL failed', err);
      setError('Failed to save resume');
    } finally {
      setResumeUploading(false);
    }
  };

  const handleUniversityIdUpload = async () => {
    try {
      const file = await pickFile();
      if (!file) return;
      if (file.size && file.size > MAX_FILE_SIZE) {
        setError('File exceeds 5 MB limit');
        return;
      }
      setResumeUploading(true);
      const name = file.name || file.uri?.split('/')?.pop() || 'university-id.pdf';
      const signedResp = await api.get(`/uploads/signed-url?filename=${encodeURIComponent(name)}`);
      const { uploadUrl, fileUrl } = signedResp.data;
      if (file.file) {
        await fetch(uploadUrl, { method: 'PUT', body: file.file });
      } else if (file.uri) {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        await fetch(uploadUrl, { method: 'PUT', body: blob });
      }
      await persistExtendedProfile({ universityIdUrl: fileUrl });
      applyProfileUpdates({ universityIdUrl: fileUrl });
      Alert.alert('Success', 'University ID uploaded and saved');
    } catch (err) {
      console.error('University ID upload failed', err);
      setError('Failed to upload university ID');
    } finally {
      setResumeUploading(false);
    }
  };

  const submitSchoolDetails = async () => {
    const trimmedSchool = schoolName.trim();
    const trimmedProgram = program.trim();
    const trimmedStudentId = studentIdNumber.trim();
    const trimmedYear = yearOfStudy.trim();

    if (!trimmedSchool || !trimmedProgram || !trimmedStudentId) {
      setError('Please fill in school name, student ID, and program');
      return;
    }

    const payload = {
      schoolDetails: {
        schoolName: trimmedSchool,
        program: trimmedProgram,
        studentIdNumber: trimmedStudentId,
        yearOfStudy: trimmedYear,
        status: profile?.schoolDetails?.status || 'pending',
      },
    };

    try {
      setSaving(true);
      await persistExtendedProfile(payload);
      applyProfileUpdates(payload);
      setSchoolModalVisible(false);
      Alert.alert('Saved', 'School details saved and pending verification');
    } catch (err) {
      console.error('Saving school details failed', err);
      setError('Failed to save school details');
    } finally {
      setSaving(false);
    }
  };

  const saveSetting = async () => {
    if (!activeSetting) return;
    let backendPayload = {};
    let extendedPayload = {};

    try {
      setSaving(true);
      switch (activeSetting) {
        case 'bio': {
          const bio = bioInput.trim();
          backendPayload = { bio };
          extendedPayload = { bio };
          break;
        }
        case 'education': {
          extendedPayload = { education: educationInput.trim() };
          break;
        }
        case 'experience': {
          extendedPayload = { experience: experienceInput.trim() };
          break;
        }
        case 'skills': {
          extendedPayload = { skills: normalizeList(skillsInput) };
          break;
        }
        case 'languages': {
          extendedPayload = { languages: normalizeList(languagesInput) };
          break;
        }
        case 'contact': {
          const phone = contactPhone.trim();
          const locationValue = locationInput.trim();
          extendedPayload = { phone, location: locationValue };
          if (locationValue) {
            backendPayload = { location: locationValue };
          }
          break;
        }
        case 'availability': {
          const availability = availabilityInput.trim();
          extendedPayload = { availability };
          if (availability) {
            await updateAvailabilityStatus(availability);
          }
          break;
        }
        case 'portfolio': {
          extendedPayload = { portfolioUrl: portfolioUrlInput.trim() };
          break;
        }
        case 'social': {
          extendedPayload = {
            socialLinks: {
              linkedIn: linkedInInput.trim(),
              github: githubInput.trim(),
              website: websiteInput.trim(),
            },
          };
          break;
        }
        case 'achievements': {
          extendedPayload = { achievements: normalizeList(achievementsInput.replace(/\r/g, '\n')) };
          break;
        }
        case 'certifications': {
          extendedPayload = { certifications: normalizeList(certificationsInput.replace(/\r/g, '\n')) };
          break;
        }
        default:
          break;
      }

      if (Object.keys(backendPayload).length) {
        await updateBackendProfile(backendPayload);
      }
      if (Object.keys(extendedPayload).length) {
        await persistExtendedProfile(extendedPayload);
      }

      applyProfileUpdates({
        ...extendedPayload,
        ...backendPayload,
      });

      Alert.alert('Saved', 'Profile updated');
      setActiveSetting(null);
    } catch (err) {
      console.error('Failed to save profile setting', err);
      setError('Failed to save profile setting');
    } finally {
      setSaving(false);
    }
  };

  const openExternalLink = (url) => {
    if (!url) return;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to open link', 'Check the URL and try again.');
    });
  };

  const handlePhonePress = (phone) => {
    if (!phone) return;
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Unable to start a call', 'Check the phone number and try again.');
    });
  };

  const metrics = useMemo(
    () => [
      { label: 'Applications', value: applicationStats.total },
      { label: 'Accepted', value: applicationStats.accepted },
      { label: 'Completed', value: applicationStats.completed },
      { label: 'Pending', value: applicationStats.pending },
    ],
    [applicationStats],
  );

  const renderInfoChip = (label, value, settingKey) => {
    const display = value || 'Add details';
    const empty = !value;
    return (
      <TouchableOpacity
        key={`${settingKey}-${label}`}
        style={[styles.infoChip, empty ? styles.infoChipEmpty : null]}
        onPress={() => (settingKey ? openSetting(settingKey) : null)}
        activeOpacity={0.8}
      >
        <Text style={styles.infoChipLabel}>{label}</Text>
        <Text
          style={[styles.infoChipValue, empty ? styles.infoChipValueEmpty : null]}
          numberOfLines={2}
        >
          {display}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2196F3" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={fetchProfile} />
        }
      >
        <ErrorBanner message={error} onClose={() => setError('')} />

        <View style={styles.profileCard}>
          <View style={styles.avatarWrapper}>
            {profile?.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarEmpty} />
            )}
          </View>
          <Text style={styles.profileName}>{profile?.name || 'Student'}</Text>
          <View style={styles.roleRow}>
            <RoleBadge role={profile?.role || 'student'} />
            {Number(profile?.stats?.average_rating || 0) > 0 ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FACC15" />
                <Text style={styles.ratingText}>
                  {Number(profile.stats.average_rating).toFixed(1)}
                </Text>
              </View>
            ) : null}
          </View>
          {profile?.email ? (
            <Text style={styles.profileEmail}>{profile.email}</Text>
          ) : null}
          {profile?.location ? (
            <View style={styles.profileMetaRow}>
              <Ionicons name="location-outline" size={16} color="#475569" style={styles.profileMetaIcon} />
              <Text style={styles.profileMetaText}>{profile.location}</Text>
            </View>
          ) : null}
          {profile?.availability ? (
            <View style={styles.profileMetaRow}>
              <Ionicons name="time-outline" size={16} color="#475569" style={styles.profileMetaIcon} />
              <Text style={styles.profileMetaText}>{profile.availability}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('SavedGigsScreen')}
          >
            <Text style={styles.quickActionText}>Saved Gigs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickActionButton, styles.quickActionSecondary]}
            onPress={() => navigation.navigate('MyApplicationsScreen')}
          >
            <Text style={[styles.quickActionText, styles.quickActionSecondaryText]}>
              My Applications
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Progress Snapshot</Text>
          </View>
          <View style={styles.metricsRow}>
            {metrics.map((metric) => (
              <View key={metric.label} style={styles.metricCard}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                <Text style={styles.metricValue}>{metric.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Career Overview</Text>
            <TouchableOpacity onPress={() => openSetting('bio')}>
              <Text style={styles.sectionAction}>Edit Bio</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionBodyText}>
            {profile?.bio || 'Introduce yourself with a short bio so providers can get to know you.'}
          </Text>
          <View style={styles.infoChipRow}>
            {renderInfoChip('Availability', profile?.availability, 'availability')}
            {renderInfoChip('Languages', (profile?.languages || []).join(', '), 'languages')}
            {renderInfoChip('Location', profile?.location, 'contact')}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Academic Background</Text>
            <TouchableOpacity onPress={openSchoolModal}>
              <Text style={styles.sectionAction}>Update School</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>Verified details help providers trust your credentials.</Text>
          <View style={styles.infoChipRow}>
            {renderInfoChip('Institution', profile?.schoolDetails?.schoolName, null)}
            {renderInfoChip('Program', profile?.schoolDetails?.program, null)}
            {renderInfoChip('Year of Study', profile?.schoolDetails?.yearOfStudy, null)}
            {renderInfoChip('Student ID', profile?.schoolDetails?.studentIdNumber, null)}
            {profile?.schoolDetails?.status ? (
              <View style={[styles.infoChip, styles.schoolStatusChip]}>
                <Text style={styles.infoChipLabel}>Verification</Text>
                <Text style={[styles.infoChipValue, styles.schoolStatusText]}>
                  {toTitleCaseStatus(profile.schoolDetails.status)}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={[styles.buttonRow, { marginTop: 12 }]}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleUniversityIdUpload}
              disabled={resumeUploading}
            >
              <Text style={styles.uploadButtonText}>
                {resumeUploading ? 'Uploading…' : 'Upload University ID'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonSecondary]}
              onPress={openSchoolModal}
            >
              <Text style={styles.uploadButtonSecondaryText}>Enter School Details</Text>
            </TouchableOpacity>
          </View>
          {profile?.universityIdUrl ? (
            <TouchableOpacity
              style={[styles.resumeRow, { marginTop: 16 }]}
              onPress={() => openExternalLink(profile.universityIdUrl)}
            >
              <Ionicons name="card" size={18} color="#2563EB" />
              <Text style={[styles.resumeText, { marginLeft: 8 }]}>View University ID</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {completedTasks.length ? (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Wins</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CompletedGigsScreen')}>
                <Text style={styles.sectionAction}>View Completed</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSubtitle}>
              Highlights from gigs you have already wrapped — perfect talking points for new applications.
            </Text>
            {completedTasks.map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskHeaderRow}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskDate}>{formatDate(task.completedAt)}</Text>
                </View>
                {task.summary ? <Text style={styles.taskSummary}>{task.summary}</Text> : null}
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Experience & Highlights</Text>
            <TouchableOpacity onPress={() => openSetting('experience')}>
              <Text style={styles.sectionAction}>Update Experience</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionBodyText}>
            {profile?.experience || 'Share the projects or gigs you have completed so far.'}
          </Text>
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Achievements</Text>
            <TouchableOpacity onPress={() => openSetting('achievements')}>
              <Text style={styles.sectionAction}>Add Achievement</Text>
            </TouchableOpacity>
          </View>
          {profile?.achievements?.length ? (
            profile.achievements.map((item, idx) => (
              <View key={`ach-${idx}`} style={styles.listItem}>
                <View style={styles.listBullet} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionBodyText}>Showcase awards, wins, or milestones to stand out.</Text>
          )}
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Certifications</Text>
            <TouchableOpacity onPress={() => openSetting('certifications')}>
              <Text style={styles.sectionAction}>Add Certification</Text>
            </TouchableOpacity>
          </View>
          {profile?.certifications?.length ? (
            profile.certifications.map((item, idx) => (
              <View key={`cert-${idx}`} style={styles.listItem}>
                <View style={styles.listBullet} />
                <Text style={styles.listItemText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.sectionBodyText}>Document your badges, certificates, or coursework.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Skills & Languages</Text>
            <TouchableOpacity onPress={() => openSetting('skills')}>
              <Text style={styles.sectionAction}>Manage Skills</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsWrap}>
            {(profile?.skills || []).length ? (
              profile.skills.map((skill) => (
                <View key={skill} style={styles.skillChip}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionBodyText}>Add skills you feel confident offering to providers.</Text>
            )}
          </View>
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Languages</Text>
            <TouchableOpacity onPress={() => openSetting('languages')}>
              <Text style={styles.sectionAction}>Update Languages</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.skillsWrap}>
            {(profile?.languages || []).length ? (
              profile.languages.map((language) => (
                <View key={language} style={[styles.skillChip, { backgroundColor: '#FBEFFF' }]}>
                  <Text style={[styles.skillChipText, { color: '#7C3AED' }]}>{language}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.sectionBodyText}>List the languages you are comfortable working in.</Text>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Portfolio & Resume</Text>
          </View>
          <View style={styles.resumeRow}>
            <Ionicons name="document-text-outline" size={18} color="#2563EB" />
            <TouchableOpacity onPress={() => openExternalLink(profile?.resumeUrl)}>
              <Text style={[styles.resumeText, { marginLeft: 8 }]}>
                {profile?.resumeUrl ? 'View Resume' : 'Add your resume to boost your profile'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleResumeUpload}
              disabled={resumeUploading}
            >
              <Text style={styles.uploadButtonText}>
                {resumeUploading ? 'Uploading…' : 'Upload Resume'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.uploadButtonSecondary]}
              onPress={() => setResumeModalVisible(true)}
            >
              <Text style={styles.uploadButtonSecondaryText}>Add Resume URL</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionSubtitle}>Portfolio</Text>
            <TouchableOpacity onPress={() => openSetting('portfolio')}>
              <Text style={styles.sectionAction}>Update Link</Text>
            </TouchableOpacity>
          </View>
          {profile?.portfolioUrl ? (
            <TouchableOpacity onPress={() => openExternalLink(profile.portfolioUrl)}>
              <Text style={styles.socialLink}>{profile.portfolioUrl}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.sectionBodyText}>Add a portfolio or project link to showcase your work.</Text>
          )}
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Contact & Social</Text>
            <TouchableOpacity onPress={() => openSetting('contact')}>
              <Text style={styles.sectionAction}>Update Contact</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.socialRow} onPress={() => openExternalLink(`mailto:${profile?.email}`)}>
            <Text style={styles.socialLabel}>Email</Text>
            <Text style={styles.socialLink}>{profile?.email || 'Add email'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialRow} onPress={() => handlePhonePress(profile?.phone)}>
            <Text style={styles.socialLabel}>Phone</Text>
            <Text style={styles.socialLink}>{profile?.phone || 'Add phone number'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialRow} onPress={() => openSetting('contact')}>
            <Text style={styles.socialLabel}>Location</Text>
            <Text style={styles.socialLink}>{profile?.location || 'Add location'}</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.socialRow} onPress={() => openExternalLink(profile?.socialLinks?.linkedIn)}>
            <Text style={styles.socialLabel}>LinkedIn</Text>
            <Text style={styles.socialLink}>
              {profile?.socialLinks?.linkedIn || 'Add LinkedIn profile'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialRow} onPress={() => openExternalLink(profile?.socialLinks?.github)}>
            <Text style={styles.socialLabel}>GitHub</Text>
            <Text style={styles.socialLink}>
              {profile?.socialLinks?.github || 'Add GitHub profile'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialRow} onPress={() => openExternalLink(profile?.socialLinks?.website)}>
            <Text style={styles.socialLabel}>Website</Text>
            <Text style={styles.socialLink}>
              {profile?.socialLinks?.website || 'Add website link'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Profile Settings</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Keep your profile fresh by updating the sections that matter most.
          </Text>
          <View style={styles.settingsGrid}>
            {SETTINGS_DEFINITION.map((tile) => (
              <TouchableOpacity
                key={tile.key}
                style={styles.settingTile}
                onPress={() => openSetting(tile.key)}
              >
                <Ionicons name={tile.icon} size={26} color="#2B75F6" />
                <Text style={styles.settingLabel}>{tile.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>My Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyApplicationsScreen')}>
              <Text style={styles.sectionAction}>View All</Text>
            </TouchableOpacity>
          </View>
          {applications.length ? (
            applications.map((application) => (
              <TouchableOpacity
                key={application.id}
                style={styles.applicationCard}
                onPress={() => navigation.navigate('ApplicationDetails', { id: application.id })}
              >
                <View style={styles.applicationHeader}>
                  <Text style={styles.applicationTitle}>{application.title}</Text>
                  <View
                    style={[styles.statusBadge, { backgroundColor: `${application.statusColor}1A` }]}
                  >
                    <Text style={[styles.statusText, { color: application.statusColor }]}>
                      {application.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.applicationMeta}>Applied {formatDate(application.appliedAt)}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color="#CBD5F5" />
              <Text style={styles.emptyStateText}>No applications yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={resumeModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Resume URL</Text>
            <Text style={styles.modalDescription}>Paste a link to your resume (PDF or Word).</Text>
            <TextInput
              placeholder="https://.../resume.pdf"
              value={resumeUrlInput}
              onChangeText={setResumeUrlInput}
              style={styles.modalInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => { setResumeModalVisible(false); setResumeUrlInput(''); }} style={{ padding: 10 }}>
                <Text style={{ color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitResumeUrl} style={{ padding: 10 }}>
                <Text style={styles.modalActionText}>{resumeUploading ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={schoolModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>School Details</Text>
            <TextInput
              placeholder="University / School"
              value={schoolName}
              onChangeText={setSchoolName}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Student ID Number"
              value={studentIdNumber}
              onChangeText={setStudentIdNumber}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Program / Course"
              value={program}
              onChangeText={setProgram}
              style={styles.modalInput}
            />
            <TextInput
              placeholder="Year of Study"
              value={yearOfStudy}
              onChangeText={setYearOfStudy}
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setSchoolModalVisible(false)} style={{ padding: 10 }}>
                <Text style={{ color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submitSchoolDetails} style={{ padding: 10 }}>
                <Text style={styles.modalActionText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!activeSetting} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {(activeSetting || '').replace(/^[a-z]/, (c) => c.toUpperCase())}
            </Text>
            <Text style={styles.modalDescription}>
              Update your {activeSetting} information below.
            </Text>

            {activeSetting === 'bio' && (
              <TextInput
                multiline
                value={bioInput}
                onChangeText={setBioInput}
                style={[styles.modalInput, { minHeight: 100 }]}
                placeholder="Short bio about yourself"
              />
            )}

            {activeSetting === 'education' && (
              <TextInput
                multiline
                value={educationInput}
                onChangeText={setEducationInput}
                style={[styles.modalInput, { minHeight: 100 }]}
                placeholder="Highlight your education history"
              />
            )}

            {activeSetting === 'experience' && (
              <TextInput
                multiline
                value={experienceInput}
                onChangeText={setExperienceInput}
                style={[styles.modalInput, { minHeight: 120 }]}
                placeholder="Describe your previous work or gigs"
              />
            )}

            {activeSetting === 'skills' && (
              <TextInput
                value={skillsInput}
                onChangeText={setSkillsInput}
                style={styles.modalInput}
                placeholder="Comma-separated list: e.g., Python, Tutoring, Excel"
              />
            )}

            {activeSetting === 'contact' && (
              <>
                <TextInput
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  style={styles.modalInput}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
                <TextInput
                  value={locationInput}
                  onChangeText={setLocationInput}
                  style={styles.modalInput}
                  placeholder="City, Country"
                />
              </>
            )}

            {activeSetting === 'availability' && (
              <TextInput
                value={availabilityInput}
                onChangeText={setAvailabilityInput}
                style={styles.modalInput}
                placeholder="e.g., Weekdays 6pm-9pm, Weekends 9am-2pm"
              />
            )}

            {activeSetting === 'languages' && (
              <TextInput
                value={languagesInput}
                onChangeText={setLanguagesInput}
                style={styles.modalInput}
                placeholder="Comma-separated: English, Kinyarwanda"
              />
            )}

            {activeSetting === 'portfolio' && (
              <TextInput
                value={portfolioUrlInput}
                onChangeText={setPortfolioUrlInput}
                style={styles.modalInput}
                placeholder="https://portfolio.example.com"
                autoCapitalize="none"
              />
            )}

            {activeSetting === 'social' && (
              <>
                <TextInput
                  value={linkedInInput}
                  onChangeText={setLinkedInInput}
                  style={styles.modalInput}
                  placeholder="LinkedIn URL"
                  autoCapitalize="none"
                />
                <TextInput
                  value={githubInput}
                  onChangeText={setGithubInput}
                  style={styles.modalInput}
                  placeholder="GitHub URL"
                  autoCapitalize="none"
                />
                <TextInput
                  value={websiteInput}
                  onChangeText={setWebsiteInput}
                  style={styles.modalInput}
                  placeholder="Personal website"
                  autoCapitalize="none"
                />
              </>
            )}

            {activeSetting === 'achievements' && (
              <TextInput
                multiline
                value={achievementsInput}
                onChangeText={setAchievementsInput}
                style={[styles.modalInput, { minHeight: 120 }]}
                placeholder="One achievement per line"
              />
            )}

            {activeSetting === 'certifications' && (
              <TextInput
                multiline
                value={certificationsInput}
                onChangeText={setCertificationsInput}
                style={[styles.modalInput, { minHeight: 120 }]}
                placeholder="One certification per line"
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={closeSetting} style={{ padding: 10 }}>
                <Text style={{ color: '#64748B' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveSetting} style={{ padding: 10 }}>
                <Text style={styles.modalActionText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
  },
  header: {
    backgroundColor: BRAND_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 2,
    marginBottom: 16,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: '#2B75F6',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND_DARK,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  ratingText: {
    marginLeft: 4,
    fontWeight: '600',
    color: '#B45309',
    fontSize: 13,
  },
  profileEmail: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  profileMetaIcon: {
    marginRight: 6,
  },
  profileMetaText: {
    fontSize: 14,
    color: '#475569',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quickActionButton: {
    backgroundColor: BRAND_BLUE,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  quickActionSecondary: {
    backgroundColor: '#E3EAF6',
  },
  quickActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  quickActionSecondaryText: {
    color: BRAND_DARK,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: BRAND_DARK,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_DARK,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_BLUE,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 10,
  },
  sectionBodyText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  infoChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  infoChip: {
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
  },
  infoChipEmpty: {
    backgroundColor: '#E2E8F0',
  },
  infoChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  infoChipValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_DARK,
  },
  infoChipValueEmpty: {
    color: '#475569',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    flexBasis: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: BRAND_DARK,
    marginTop: 6,
  },
  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  skillChip: {
    backgroundColor: '#E0F2FE',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  skillChipText: {
    color: '#0369A1',
    fontWeight: '600',
    fontSize: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resumeText: {
    color: BRAND_BLUE,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: BRAND_BLUE,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginRight: 12,
    marginBottom: 10,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  uploadButtonSecondary: {
    backgroundColor: '#E3EAF6',
  },
  uploadButtonSecondaryText: {
    color: BRAND_DARK,
    fontWeight: '700',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialLabel: {
    width: 90,
    color: '#475569',
    fontWeight: '600',
  },
  socialLink: {
    color: BRAND_BLUE,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
  applicationCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_DARK,
  },
  applicationMeta: {
    marginTop: 6,
    color: '#64748B',
    fontSize: 13,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  settingTile: {
    width: '30%',
    minWidth: 96,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
  },
  settingLabel: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
    color: BRAND_DARK,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000066',
  },
  modalContent: {
    width: '92%',
    maxWidth: 520,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: BRAND_DARK,
  },
  modalDescription: {
    marginBottom: 12,
    color: '#475569',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: LIGHT_BORDER,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  modalActionText: {
    color: BRAND_BLUE,
    fontWeight: '700',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BRAND_BLUE,
    marginTop: 8,
    marginRight: 10,
  },
  listItemText: {
    flex: 1,
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  taskCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_DARK,
    marginRight: 12,
  },
  taskDate: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_BLUE,
  },
  taskSummary: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  schoolStatusChip: {
    backgroundColor: '#EEF2FF',
  },
  schoolStatusText: {
    color: '#4338CA',
  },
});

export default ProfileScreen;

