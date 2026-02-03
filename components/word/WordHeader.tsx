import { Audio } from "expo-av";
import { useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
  word: string;
  ipa: string;
  audio: string; // url hoặc local asset
};

export default function WordHeader({ word, ipa, audio }: Props) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playAudio = async () => {
    try {
      // nếu đã load rồi → replay
      if (sound) {
        await sound.replayAsync();
        return;
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audio },
        { shouldPlay: true }
      );

      setSound(newSound);
    } catch (err) {
      console.warn("Audio error:", err);
    }
  };

  // cleanup khi unmount (best practice)
  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
        backgroundColor: "#fff",
      }}
    >
      <Text style={{ fontSize: 28, fontWeight: "700" }}>{word}</Text>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          marginTop: 4,
        }}
      >
        <Text style={{ fontSize: 16, color: "#444" }}>{ipa}</Text>

        <TouchableOpacity onPress={playAudio}>
          <Text style={{ fontSize: 18 }}>🔊</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}