import { useState } from 'react';
import { Check, X, Minus, Plus, Mic, Trash2 } from 'lucide-react';

type TabType = 'ada' | 'qaza';
type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

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

export default function LogPage() {
  const [activeTab, setActiveTab] = useState<TabType>('ada');
  const [expandedPrayer, setExpandedPrayer] = useState<PrayerName | null>(null);

  const [adaPrayers, setAdaPrayers] = useState<AdaPrayer[]>([
    { name: 'Fajr', completed: false, missed: false },
    { name: 'Dhuhr', completed: false, missed: false },
    { name: 'Asr', completed: false, missed: false },
    { name: 'Maghrib', completed: false, missed: false },
    { name: 'Isha', completed: false, missed: false },
  ]);

  const [qazaPrayers, setQazaPrayers] = useState<QazaPrayer[]>([
    { name: 'Fajr', count: 0 },
    { name: 'Dhuhr', count: 0 },
    { name: 'Asr', count: 0 },
    { name: 'Maghrib', count: 0 },
    { name: 'Isha', count: 0 },
  ]);

  const [isRecording, setIsRecording] = useState<PrayerName | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const reasons = ['Sleep', 'Work/Study', 'Travel', 'Health', 'Forgot', 'Voice Message', 'Other'];

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
      prayers.map(p =>
        p.name === name ? { ...p, missed: true, completed: false } : p
      )
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
      prayers.map(p =>
        p.name === name ? { ...p, otherReason } : p
      )
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
            p.name === name
              ? { ...p, voiceMessage: blob, voiceMessageUrl: url }
              : p
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
      prayers.map(p =>
        p.name === name ? { ...p, count: Math.max(0, p.count + delta) } : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white px-5 py-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold mb-1">Log Prayers</h1>
          <p className="text-gray-400 text-base">Track your daily prayers</p>
        </header>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setActiveTab('ada')}
            className={`flex-1 py-4 rounded-2xl font-medium text-lg transition-all ${
              activeTab === 'ada'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            Ada
          </button>
          <button
            onClick={() => setActiveTab('qaza')}
            className={`flex-1 py-4 rounded-2xl font-medium text-lg transition-all ${
              activeTab === 'qaza'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
            }`}
          >
            Qaza
          </button>
        </div>

        {activeTab === 'ada' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
              {adaPrayers.map((prayer, index) => (
                <div key={prayer.name}>
                  <div className="flex items-center justify-between p-5">
                    <span className="text-xl">{prayer.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => markPrayerCompleted(prayer.name)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          prayer.completed
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'border-emerald-700/50 hover:border-emerald-500'
                        }`}
                      >
                        <Check
                          size={20}
                          className={prayer.completed ? 'text-emerald-500' : 'text-gray-400'}
                        />
                      </button>
                      <button
                        onClick={() => markPrayerMissed(prayer.name)}
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                          prayer.missed
                            ? 'bg-gray-800 border-gray-600'
                            : 'border-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <X size={20} className="text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {expandedPrayer === prayer.name && prayer.missed && (
                    <div className="px-5 pb-5 pt-2 bg-gray-800/20">
                      <p className="text-gray-300 text-sm font-medium mb-1">Reason (optional)</p>
                      <p className="text-gray-500 text-xs mb-4">For personal reflection only</p>
                      <div className="flex flex-wrap gap-2">
                        {reasons.map((reason) => (
                          <button
                            key={reason}
                            onClick={() => setReasonForPrayer(prayer.name, reason)}
                            className={`px-4 py-2 rounded-lg text-sm transition-all ${
                              prayer.reason === reason
                                ? 'bg-emerald-500 text-white'
                                : 'bg-gray-800/50 hover:bg-gray-700/50 text-gray-300'
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
                            onChange={(e) => setOtherReasonForPrayer(prayer.name, e.target.value)}
                            className="w-full bg-gray-800/50 border border-teal-700/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
                          />
                        </div>
                      )}

                      {prayer.reason === 'Voice Message' && (
                        <div className="mt-4 space-y-3">
                          {!prayer.voiceMessageUrl ? (
                            <button
                              onClick={() =>
                                isRecording === prayer.name
                                  ? stopRecording()
                                  : startRecording(prayer.name)
                              }
                              className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                                isRecording === prayer.name
                                  ? 'bg-red-500/20 border border-red-500 text-red-400'
                                  : 'bg-emerald-500/20 border border-emerald-500 text-emerald-400 hover:bg-emerald-500/30'
                              }`}
                            >
                              <Mic size={18} />
                              {isRecording === prayer.name ? 'Stop Recording' : 'Record Voice Message'}
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <audio
                                src={prayer.voiceMessageUrl}
                                controls
                                className="flex-1 h-10"
                              />
                              <button
                                onClick={() => deleteVoiceMessage(prayer.name)}
                                className="w-10 h-10 rounded-lg bg-gray-800/50 hover:bg-red-500/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-all"
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
                    <div className="h-px bg-gray-800/50 mx-5"></div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-medium text-lg">
              Save
            </button>
          </div>
        )}

        {activeTab === 'qaza' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/30 rounded-2xl border border-teal-700/30 overflow-hidden">
              {qazaPrayers.map((prayer, index) => (
                <div key={prayer.name}>
                  <div className="flex items-center justify-between p-5">
                    <span className="text-xl">{prayer.name}</span>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => updateQazaCount(prayer.name, -1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-teal-700/50 hover:bg-gray-800/50 transition-colors"
                      >
                        <Minus size={18} className="text-gray-400" />
                      </button>
                      <span className="text-2xl font-medium w-12 text-center">{prayer.count}</span>
                      <button
                        onClick={() => updateQazaCount(prayer.name, 1)}
                        className="w-10 h-10 rounded-full flex items-center justify-center border border-emerald-500 hover:bg-emerald-500/20 transition-colors"
                      >
                        <Plus size={18} className="text-emerald-500" />
                      </button>
                    </div>
                  </div>
                  {index < qazaPrayers.length - 1 && (
                    <div className="h-px bg-gray-800/50 mx-5"></div>
                  )}
                </div>
              ))}
            </div>

            <button className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-4 rounded-2xl font-medium text-lg">
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
