// Singleton Audio Manager - ensures only one sound plays at a time across the app
import { Audio, AVPlaybackStatus } from 'expo-av';
import {
  getChapterAudioUrl, saveAudioState, loadAudioState,
  markChapterListened, getVoicePreference,
  getNextSpeed, VOICE_OPTIONS,
} from './audio';
import { BIBLE_BOOKS } from './bible';

export type AudioManagerListener = (state: AudioManagerState) => void;

export interface AudioManagerState {
  isPlaying: boolean;
  isLoaded: boolean;
  isBuffering: boolean;
  positionMs: number;
  durationMs: number;
  currentBook: string;
  currentChapter: number;
  currentVoice: string;
  speed: number;
  audioLoading: boolean;
}

const DEFAULT_STATE: AudioManagerState = {
  isPlaying: false,
  isLoaded: false,
  isBuffering: false,
  positionMs: 0,
  durationMs: 0,
  currentBook: 'Genesis',
  currentChapter: 1,
  currentVoice: 'standard',
  speed: 1.0,
  audioLoading: false,
};

class AudioManager {
  private sound: Audio.Sound | null = null;
  private state: AudioManagerState = { ...DEFAULT_STATE };
  private listeners: Set<AudioManagerListener> = new Set();
  private initialized = false;

  async init() {
    if (this.initialized) return;
    this.initialized = true;

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    // Restore saved state
    const voice = await getVoicePreference();
    const saved = await loadAudioState();
    this.state.currentVoice = voice;
    if (saved.currentBook) this.state.currentBook = saved.currentBook;
    if (saved.currentChapter) this.state.currentChapter = saved.currentChapter;
    if (saved.playbackSpeed) this.state.speed = saved.playbackSpeed;
    this.notify();
  }

  subscribe(listener: AudioManagerListener): () => void {
    this.listeners.add(listener);
    // Send current state immediately
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const snapshot = { ...this.state };
    this.listeners.forEach(l => l(snapshot));
  }

  private update(partial: Partial<AudioManagerState>) {
    Object.assign(this.state, partial);
    this.notify();
  }

  getState(): AudioManagerState {
    return { ...this.state };
  }

  private onPlaybackStatus = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      this.update({
        isLoaded: true,
        isPlaying: status.isPlaying,
        isBuffering: status.isBuffering || false,
        positionMs: status.positionMillis || 0,
        durationMs: status.durationMillis || 0,
      });
      if (status.didJustFinish) {
        this.playNext();
      }
    }
  };

  async loadAndPlay(book: string, chapter: number, voiceId?: string) {
    this.update({ audioLoading: true });

    // Unload existing sound
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {
        // ignore
      }
      this.sound = null;
    }

    const voice = voiceId || this.state.currentVoice;
    this.update({
      currentBook: book,
      currentChapter: chapter,
      currentVoice: voice,
      positionMs: 0,
      durationMs: 0,
      isPlaying: false,
      isLoaded: false,
    });

    try {
      const url = await getChapterAudioUrl(book, chapter, voice);

      if (url) {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true, rate: this.state.speed },
          this.onPlaybackStatus
        );
        this.sound = newSound;
        this.update({ isPlaying: true, audioLoading: false });
        saveAudioState({
          currentBook: book,
          currentChapter: chapter,
          currentVoice: voice,
          playbackSpeed: this.state.speed,
        });
        markChapterListened(book, chapter);
      } else {
        this.update({ audioLoading: false });
      }
    } catch (err) {
      console.error('Error loading audio:', err);
      this.update({ audioLoading: false });
    }
  }

  async playPause() {
    if (this.state.audioLoading) return;

    if (this.sound && this.state.isPlaying) {
      await this.sound.pauseAsync();
      this.update({ isPlaying: false });
      return;
    }

    if (this.sound && !this.state.isPlaying && this.state.isLoaded) {
      await this.sound.playAsync();
      this.update({ isPlaying: true });
      return;
    }

    // No sound loaded, start playing current book/chapter
    await this.loadAndPlay(this.state.currentBook, this.state.currentChapter);
  }

  async playNext() {
    const bookData = BIBLE_BOOKS.find(b => b.name === this.state.currentBook);
    if (!bookData) return;

    if (this.state.currentChapter < bookData.chapters) {
      await this.loadAndPlay(this.state.currentBook, this.state.currentChapter + 1);
    } else {
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === this.state.currentBook);
      if (bookIdx < BIBLE_BOOKS.length - 1) {
        await this.loadAndPlay(BIBLE_BOOKS[bookIdx + 1].name, 1);
      }
    }
  }

  async playPrev() {
    if (this.state.currentChapter > 1) {
      await this.loadAndPlay(this.state.currentBook, this.state.currentChapter - 1);
    } else {
      const bookIdx = BIBLE_BOOKS.findIndex(b => b.name === this.state.currentBook);
      if (bookIdx > 0) {
        const prevBook = BIBLE_BOOKS[bookIdx - 1];
        await this.loadAndPlay(prevBook.name, prevBook.chapters);
      }
    }
  }

  async skipBack(seconds: number = 15) {
    if (this.sound) {
      const newPos = Math.max(0, this.state.positionMs - seconds * 1000);
      await this.sound.setPositionAsync(newPos);
    }
  }

  async skipForward(seconds: number = 15) {
    if (this.sound) {
      const newPos = Math.min(this.state.durationMs, this.state.positionMs + seconds * 1000);
      await this.sound.setPositionAsync(newPos);
    }
  }

  async cycleSpeed() {
    const next = getNextSpeed(this.state.speed);
    this.update({ speed: next });
    if (this.sound) {
      await this.sound.setRateAsync(next, true);
    }
    saveAudioState({ playbackSpeed: next });
  }

  async setVoice(voiceId: string) {
    this.update({ currentVoice: voiceId });
    // If currently playing, reload with new voice
    if (this.sound && this.state.isPlaying) {
      await this.loadAndPlay(this.state.currentBook, this.state.currentChapter, voiceId);
    }
  }

  async cleanup() {
    if (this.sound) {
      try {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
      } catch (e) {
        // ignore
      }
      this.sound = null;
    }
  }
}

// Singleton export
export const audioManager = new AudioManager();
