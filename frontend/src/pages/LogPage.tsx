import { useState, useEffect } from 'react';
import { Check, X, Minus, Plus, Mic, Trash2 } from 'lucide-react';
import { getTelegramUserId, initTelegramApp } from '../utils/telegram';
import { api, type QazaBreakdown } from '../services/api';
import { REASONS, type PrayerName, createPrayerArray } from '../utils/prayers';
import PageContainer, { PageHeader } from '../components/PageContainer';

type TabType = 'ada' | 'qaza' | 'clear';

interface AdaPrayer {
  name: PrayerName;
  completed: boolean;
  missed: boolean;
  reason?: string;
  otherReason?: string;
  voiceMessage?: Blob;
  voiceMessageUrl?: string;
}

interface QazaPrayer {
  name: PrayerName;
  count: number;
}

const defaultAdaPrayers = () =>
  createPrayerArray<AdaPrayer>(name => ({ name, completed: false, missed: false }));

const defaultQazaPrayers = () =>
  createPrayerArray<QazaPrayer>(name => ({ name, count: 0 }));

export default function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ada');
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerName | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [adaPrayers, setAdaPrayers] = useState<AdaPrayer[]>(defaultAdaPrayers);
  const [qazaPrayers, setQazaPrayers] = useState<QazaPrayer[]>(defaultQazaPrayers);
  const [clearPrayers, setClearPrayers] = useState<QazaPrayer[]>(defaultQazaPrayers);
  const [qazaLimits, setQazaLimits] = useState<QazaBreakdown | null>(null);

  const [isRecording, setIsRecording] = useState<PrayerName | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  useEffect(() => {
    initTelegramApp();
    const id = getTelegramUserId();
    setUserId(id);

    if (id) {
      api.getQazaBreakdown(id)
        .then(setQazaLimits)
        .catch(err => console.error('Failed to fetch qaza breakdown', err));
    }
  }, []);

  const markPrayerCompleted = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, completed: true, missed: false, reason: undefined, otherReason: undefined }
          : p
      )
    );
    setExpandedPrayer(null);
  };

  const markPrayerMissed = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p => (p.name === name ? { ...p, missed: true, completed: false } : p))
    );
    setExpandedPrayer(expandedPrayer === name ? null : name);
  };

  const setReasonForPrayer = (name: PrayerName, reason: string) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, reason, otherReason: reason === 'Other' ? p.otherReason : undefined }
          : p
      )
    );
  };

  const setOtherReasonForPrayer = (name: PrayerName, otherReason: string) => {
    setAdaPrayers(prayers =>
      prayers.map(p => (p.name === name ? { ...p, otherReason } : p))
    );
  };

  const startRecording = async (name: PrayerName) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        setAdaPrayers(prayers =>
          prayers.map(p =>
            p.name === name ? { ...p, voiceMessage: blob, voiceMessageUrl: url } : p
          )
        );
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(name);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setMediaRecorder(null);
      setIsRecording(null);
    }
  };

  const deleteVoiceMessage = (name: PrayerName) => {
    setAdaPrayers(prayers =>
      prayers.map(p =>
        p.name === name
          ? { ...p, voiceMessage: undefined, voiceMessageUrl: undefined }
          : p
      )
    );
  };

  const updateQazaCount = (name: PrayerName, delta: number) => {
    setQazaPrayers(prayers =>
      prayers.map(p => (p.name === name ? { ...p, count: Math.max(0, p.count + delta) } : p))
    );
  };

  const updateClearCount = (name: PrayerName, delta: number) => {
    setClearPrayers(prayers =>
      prayers.map(p => {
        if (p.name === name) {
          const maxLimit = qazaLimits ? qazaLimits[name.toLowerCase() as keyof QazaBreakdown] : Infinity;
          const newCount = Math.max(0, p.count + delta);
          return { ...p, count: Math.min(newCount, maxLimit) };
        }
        return p;
      })
    );
  };

  const handleSaveAda = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      const prayersToSave = adaPrayers
        .filter(prayer => prayer.completed || prayer.missed)
        .map(prayer => ({
          prayer: prayer.name.toLowerCase(),
          status: (prayer.completed ? 'completed' : 'missed') as 'completed' | 'missed',
          reason:
            prayer.missed && prayer.reason
              ? prayer.reason === 'Other'
                ? prayer.otherReason
                : prayer.reason
              : undefined,
        }));

      if (prayersToSave.length === 0) {
        setSaveMessage('Please mark at least one prayer');
        setSaving(false);
        return;
      }

      await api.logAdaPrayer(userId, { prayers: prayersToSave });
      setSaveMessage('Ada prayers saved successfully!');
      setAdaPrayers(defaultAdaPrayers());
      setExpandedPrayer(null);
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const buildQazaPayload = (prayers: QazaPrayer[]) => ({
    fajr: prayers.find(p => p.name === 'Fajr')?.count || 0,
    dhuhr: prayers.find(p => p.name === 'Dhuhr')?.count || 0,
    asr: prayers.find(p => p.name === 'Asr')?.count || 0,
    maghrib: prayers.find(p => p.name === 'Maghrib')?.count || 0,
    isha: prayers.find(p => p.name === 'Isha')?.count || 0,
  });

  const handleSaveQaza = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await api.logQazaPrayer(userId, buildQazaPayload(qazaPrayers));
      setSaveMessage('Qaza prayers saved successfully!');
      setQazaPrayers(defaultQazaPrayers());
      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClear = async () => {
    if (!userId) {
      setSaveMessage('Unable to save: User ID not found');
      return;
    }

    setSaving(true);
    setSaveMessage(null);

    try {
      await api.markQazasPrayed(userId, buildQazaPayload(clearPrayers));
      setSaveMessage('Qaza prayers marked as prayed!');
      setClearPrayers(defaultQazaPrayers());

      api.getQazaBreakdown(userId)
        .then(setQazaLimits)
        .catch(err => console.error('Failed to refresh qaza breakdown', err));

      setTimeout(() => setSaveMessage(null), 3000);
    } catch {
      setSaveMessage('Failed to save prayers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabSubtitle: Record<TabType, string> = {
    ada: "Mark today's prayers",
    qaza: 'Add a missed prayer to your backlog',
    clear: 'Mark backlog prayers as made up',
  };

  return (
    <PageContainer>
      <PageHeader title="Log Prayers" subtitle={tabSubtitle[activeTab]} />

      {/* Tabs */}
      <div className="flex gap-3 mb-2">
        {(['ada', 'qaza', 'clear'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`tab-button ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : 'bg-surface-800/50 text-surface-400 border border-surface-600/50'
            }`}
          >
            {tab === 'ada' ? 'Today' : tab === 'qaza' ? 'Add Missed' : 'Mark Done'}
          </button>
        ))}
      </div>

      {/* Ada Tab */}
      {activeTab === 'ada' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card overflow-hidden">
            {adaPrayers.map((prayer, index) => (
              <div key={prayer.name}>
                <div className="flex items-center justify-between p-5">
                  <span className="text-xl">{prayer.name}</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => markPrayerCompleted(prayer.name)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        prayer.completed
                          ? 'bg-primary-500/20 border-primary-500'
                          : 'border-primary-700/50 hover:border-primary-500'
                      }`}
                    >
                      <Check size={20} className={prayer.completed ? 'text-primary-500' : 'text-surface-400'} />
                    </button>
                    <button
                      onClick={() => markPrayerMissed(prayer.name)}
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        prayer.missed
                          ? 'bg-surface-800 border-surface-600'
                          : 'border-surface-600/50 hover:border-surface-400'
                      }`}
                    >
                      <X size={20} className="text-surface-400" />
                    </button>
                  </div>
                </div>

                {expandedPrayer === prayer.name && prayer.missed && (
                  <div className="px-5 pb-5 pt-2 bg-surface-800/20">
                    <p className="text-surface-300 text-sm font-medium mb-1">Reason (optional)</p>
                    <p className="text-surface-500 text-xs mb-4">For personal reflection only</p>
                    <div className="flex flex-wrap gap-2">
                      {REASONS.map(reason => (
                        <button
                          key={reason}
                          onClick={() => setReasonForPrayer(prayer.name, reason)}
                          className={`px-4 py-2 rounded-lg text-sm transition-all ${
                            prayer.reason === reason
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-800/50 hover:bg-surface-700/50 text-surface-300'
                          }`}
                        >
                          {reason}
                        </button>
                      ))}
                    </div>

                    {prayer.reason === 'Other' && (
                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Please specify..."
                          value={prayer.otherReason || ''}
                          onChange={e => setOtherReasonForPrayer(prayer.name, e.target.value)}
                          className="w-full bg-surface-800/50 border border-secondary-700/30 rounded-lg px-4 py-3 text-surface-100 placeholder-surface-500 focus:outline-none focus:border-primary-500/50"
                        />
                      </div>
                    )}

                    {prayer.reason === 'Voice Message' && (
                      <div className="mt-4 space-y-3">
                        {!prayer.voiceMessageUrl ? (
                          <button
                            onClick={() =>
                              isRecording === prayer.name ? stopRecording() : startRecording(prayer.name)
                            }
                            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                              isRecording === prayer.name
                                ? 'bg-error-500/20 border border-error-500 text-error-400'
                                : 'bg-primary-500/20 border border-primary-500 text-primary-400 hover:bg-primary-500/30'
                            }`}
                          >
                            <Mic size={18} />
                            {isRecording === prayer.name ? 'Stop Recording' : 'Record Voice Message'}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <audio src={prayer.voiceMessageUrl} controls className="flex-1 h-10" />
                            <button
                              onClick={() => deleteVoiceMessage(prayer.name)}
                              className="w-10 h-10 rounded-lg bg-surface-800/50 hover:bg-error-500/20 text-surface-400 hover:text-error-400 flex items-center justify-center transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {index < adaPrayers.length - 1 && (
                  <div className="h-px bg-surface-800/50 mx-5"></div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveAda} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMessage && (
            <div className={`text-center text-sm ${saveMessage.includes('successfully') ? 'text-primary-400' : 'text-error-400'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {/* Qaza Tab */}
      {activeTab === 'qaza' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card overflow-hidden">
            {qazaPrayers.map((prayer, index) => (
              <div key={prayer.name}>
                <div className="flex items-center justify-between p-5">
                  <span className="text-xl">{prayer.name}</span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => updateQazaCount(prayer.name, -1)}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-secondary-700/50 hover:bg-surface-800/50 transition-colors"
                    >
                      <Minus size={18} className="text-surface-400" />
                    </button>
                    <span className="text-2xl font-medium w-12 text-center">{prayer.count}</span>
                    <button
                      onClick={() => updateQazaCount(prayer.name, 1)}
                      className="w-10 h-10 rounded-full flex items-center justify-center border border-primary-500 hover:bg-primary-500/20 transition-colors"
                    >
                      <Plus size={18} className="text-primary-500" />
                    </button>
                  </div>
                </div>
                {index < qazaPrayers.length - 1 && (
                  <div className="h-px bg-surface-800/50 mx-5"></div>
                )}
              </div>
            ))}
          </div>

          <button onClick={handleSaveQaza} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMessage && (
            <div className={`text-center text-sm ${saveMessage.includes('successfully') ? 'text-primary-400' : 'text-error-400'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      )}

      {/* Clear Tab */}
      {activeTab === 'clear' && (
        <div className="space-y-4 animate-fade-in">
          <div className="card overflow-hidden">
            {clearPrayers.map((prayer, index) => {
              const maxLimit = qazaLimits ? qazaLimits[prayer.name.toLowerCase() as keyof QazaBreakdown] : 0;
              return (
                <div key={prayer.name}>
                  <div className="flex items-center justify-between p-5">
                    <div className="flex flex-col">
                      <span className="text-xl">{prayer.name}</span>
                      {qazaLimits && (
                        <span className="text-xs text-surface-500">Max: {maxLimit}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateClearCount(prayer.name, -1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-secondary-700/50 hover:bg-surface-800/50 transition-colors"
                      >
                        <Minus size={18} className="text-surface-400" />
                      </button>
                      <span className="text-2xl font-medium w-12 text-center">{prayer.count}</span>
                      <button
                        onClick={() => updateClearCount(prayer.name, 1)}
                        disabled={prayer.count >= maxLimit}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-primary-500 hover:bg-primary-500/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={18} className="text-primary-500" />
                      </button>
                    </div>
                  </div>
                  {index < clearPrayers.length - 1 && (
                    <div className="h-px bg-surface-800/50 mx-5"></div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={handleSaveClear} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Save'}
          </button>
          {saveMessage && (
            <div className={`text-center text-sm ${saveMessage.includes('successfully') || saveMessage.includes('prayed') ? 'text-primary-400' : 'text-error-400'}`}>
              {saveMessage}
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
