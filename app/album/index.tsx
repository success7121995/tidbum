import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { initDb } from "../../lib/db";

const HomeScreen = () => {
    
    useEffect(() => {
        (async () => {
            await initDb();
        })();
    }, []);

    return (
        <View className="bg-white flex-1">

            {/* Header bar */}
            <View className="flex-row justify-end items-center px-4 py-2">
                <TouchableOpacity onPress={() => router.push('/album/create')}>
                    <FontAwesome6 name="add" size={24} color="black" />
                </TouchableOpacity>
            </View>

        </View>
    );
};

export default HomeScreen;