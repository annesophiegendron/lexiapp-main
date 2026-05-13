import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Alert,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
} from 'react-native-audio-recorder-player';

import {useCaptures} from '../context/CaptureContext';

const audioRecorderPlayer = new AudioRecorderPlayer();

const RECORDING_OPTIONS = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
  AVFormatIDKeyIOS: 'aac',
  AVNumberOfChannelsKeyIOS: 1,
};

const construireNomFichier = () => `capture-${Date.now()}.m4a`;

const formaterStatutIa = etapeIa => {
  if (!etapeIa) {
    return 'etat inconnu';
  }

  const detail = etapeIa.detail ? ` - ${etapeIa.detail}` : '';

  if (etapeIa.statut === 'fallback') {
    return `fallback${etapeIa.modele ? ` (${etapeIa.modele})` : ''}${detail}`;
  }

  return `${etapeIa.statut}${etapeIa.modele ? ` (${etapeIa.modele})` : ''}${detail}`;
};

const formaterResumePreflight = backendStatus => {
  if (!backendStatus?.preflight?.checks?.length) {
    return backendStatus?.preflight?.message || 'Verification backend indisponible.';
  }

  const checksEnEchec = backendStatus.preflight.checks.filter(
    check => check.statut === 'FAIL',
  );

  if (checksEnEchec.length === 0) {
    return backendStatus.preflight.message;
  }

  return checksEnEchec
    .slice(0, 2)
    .map(check => `${check.sujet}: ${check.detail}`)
    .join(' | ');
};

const CaptureMomentScreen = ({isVisible, onClose}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');
  const [audioUri, setAudioUri] = useState('');
  const [latitude, setLatitude] = useState('48.8566');
  const [longitude, setLongitude] = useState('2.3522');
  const [language, setLanguage] = useState('fr');
  const [lastCapture, setLastCapture] = useState(null);
  const recorderPathRef = useRef('');
  const {uploadCapture, isSubmitting, error, backendStatus, refreshBackendStatus} = useCaptures();

  const isUploadDisabled = useMemo(
    () =>
      !audioUri ||
      isRecording ||
      isSubmitting ||
      !backendStatus.isReady ||
      latitude.trim() === '' ||
      longitude.trim() === '',
    [audioUri, backendStatus.isReady, isRecording, isSubmitting, latitude, longitude],
  );

  useEffect(() => {
    return () => {
      audioRecorderPlayer.removeRecordBackListener();
      audioRecorderPlayer.stopRecorder().catch(() => null);
    };
  }, []);

  const reinitialiserEtat = () => {
    setIsRecording(false);
    setRecordTime('00:00');
    setAudioUri('');
    setLastCapture(null);
    recorderPathRef.current = '';
  };

  const fermerModal = () => {
    if (isRecording) {
      Alert.alert('Recording in progress', 'Stop the recording before closing this screen.');
      return;
    }
    reinitialiserEtat();
    onClose();
  };

  const demanderPermissionMicro = async () => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      {
        title: 'Microphone access',
        message: 'Lexi needs microphone access to record an audio capture.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  const demarrerEnregistrement = async () => {
    const granted = await demanderPermissionMicro();
    if (!granted) {
      Alert.alert('Permission denied', 'Microphone permission is required to record audio.');
      return;
    }

    try {
      audioRecorderPlayer.setSubscriptionDuration(0.2);
      const uri = await audioRecorderPlayer.startRecorder(
        undefined,
        RECORDING_OPTIONS,
      );
      recorderPathRef.current = uri;
      setAudioUri(uri);
      setRecordTime('00:00');
      setIsRecording(true);
      audioRecorderPlayer.addRecordBackListener(event => {
        setRecordTime(audioRecorderPlayer.mmss(Math.floor(event.currentPosition / 1000)));
      });
    } catch (recordError) {
      Alert.alert('Recording error', recordError.message || 'Unable to start the recorder.');
    }
  };

  const arreterEnregistrement = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setAudioUri(result || recorderPathRef.current);
    } catch (recordError) {
      Alert.alert('Recording error', recordError.message || 'Unable to stop the recorder.');
    }
  };

  const envoyerCapture = async () => {
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);

    if (!backendStatus.isReady) {
      Alert.alert(
        'Backend not ready',
        formaterResumePreflight(backendStatus),
      );
      return;
    }

    if (Number.isNaN(parsedLatitude) || Number.isNaN(parsedLongitude)) {
      Alert.alert('Invalid coordinates', 'Latitude and longitude must be valid numbers.');
      return;
    }

    try {
      const createdCapture = await uploadCapture({
        audioUri,
        fileName: construireNomFichier(),
        mimeType: 'audio/m4a',
        latitude: parsedLatitude,
        longitude: parsedLongitude,
        language,
      });
      setLastCapture(createdCapture);
      Alert.alert('Capture uploaded', 'The audio was sent to the backend successfully.');
    } catch (uploadError) {
      Alert.alert('Upload error', uploadError.message);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={isVisible}
      onRequestClose={fermerModal}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Voice Capture</Text>
            <TouchableOpacity onPress={fermerModal}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Record a short phrase, then send it to the local backend for transcription and analysis.
          </Text>

          <View style={styles.backendCard}>
            <View style={styles.backendHeaderRow}>
              <Text style={styles.backendTitle}>Backend local</Text>
              <TouchableOpacity onPress={refreshBackendStatus}>
                <Text style={styles.backendRefreshText}>Refresh status</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.backendLine}>
              Health: {backendStatus.health.status} {backendStatus.health.version ? `v${backendStatus.health.version}` : ''}
            </Text>
            <Text style={styles.backendLine}>
              Preflight: {backendStatus.preflight.status}
            </Text>
            <Text style={styles.backendHint}>{formaterResumePreflight(backendStatus)}</Text>
          </View>

          <View style={styles.timerCard}>
            <Ionicons
              name={isRecording ? 'radio' : 'mic-outline'}
              size={26}
              color={isRecording ? '#b42318' : '#111'}
            />
            <Text style={styles.timerValue}>{recordTime}</Text>
            <Text style={styles.timerLabel}>
              {isRecording ? 'Recording in progress' : audioUri ? 'Recording ready' : 'Ready to record'}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.primaryButton, isRecording && styles.primaryButtonActive]}
              onPress={isRecording ? arreterEnregistrement : demarrerEnregistrement}>
              <Text style={styles.primaryButtonText}>
                {isRecording ? 'Stop recording' : 'Start recording'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, isUploadDisabled && styles.buttonDisabled]}
              onPress={envoyerCapture}
              disabled={isUploadDisabled}>
              <Text style={styles.secondaryButtonText}>
                {isSubmitting ? 'Sending...' : 'Send to backend'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <View style={styles.field}>
              <Text style={styles.label}>Latitude</Text>
              <TextInput
                style={styles.input}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="numeric"
                placeholder="48.8566"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Longitude</Text>
              <TextInput
                style={styles.input}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="numeric"
                placeholder="2.3522"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Language code</Text>
            <TextInput
              style={styles.input}
              value={language}
              onChangeText={setLanguage}
              autoCapitalize="none"
              placeholder="fr"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {!backendStatus.isReady ? (
            <Text style={styles.warningText}>
              Upload disabled until the local backend passes preflight.
            </Text>
          ) : null}

          {lastCapture ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Latest backend result</Text>
              <Text style={styles.resultLine}>Original: {lastCapture.original}</Text>
              <Text style={styles.resultLine}>
                Translation: {lastCapture.translation || 'No translation returned'}
              </Text>
              <Text style={styles.resultLine}>Formality: {lastCapture.formality}</Text>
              <Text style={styles.resultLine}>
                Transcription IA: {formaterStatutIa(lastCapture.pipelineIa?.transcription)}
              </Text>
              <Text style={styles.resultLine}>
                Analyse IA: {formaterStatutIa(lastCapture.pipelineIa?.analyse)}
              </Text>
              <Text style={styles.resultLine}>
                Tags: {lastCapture.tags.length > 0 ? lastCapture.tags.join(', ') : 'None'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    backgroundColor: '#f5f1ea',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  subtitle: {
    fontSize: 14,
    color: '#4f4b45',
    lineHeight: 20,
  },
  timerCard: {
    backgroundColor: '#fffaf2',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  backendCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e0d9cf',
  },
  backendHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  backendRefreshText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e3526',
  },
  backendLine: {
    fontSize: 13,
    color: '#3f3a33',
  },
  backendHint: {
    fontSize: 13,
    color: '#6b655c',
    lineHeight: 18,
  },
  timerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111',
  },
  timerLabel: {
    fontSize: 13,
    color: '#6b655c',
  },
  actionsRow: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: '#111',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryButtonActive: {
    backgroundColor: '#b42318',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#d7e4d0',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1e3526',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  field: {
    flex: 1,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3a3732',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7d2ca',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111',
  },
  errorText: {
    color: '#b42318',
    fontSize: 13,
  },
  warningText: {
    color: '#8a5400',
    fontSize: 13,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    gap: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  resultLine: {
    fontSize: 14,
    color: '#39342d',
  },
});

export default CaptureMomentScreen;
