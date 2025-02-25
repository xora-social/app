'use client';

import { Compose } from "@/components/compose";
import { Feed } from "@/components/feed";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useState } from "react";

export default function Page() {
  const [activeTab, setActiveTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="sticky top-0 z-[25] h-auto w-full bg-background/80 backdrop-blur">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'for-you' | 'following')}>
          <TabsList className="w-full">
            <TabsTrigger value="for-you" className="flex-1">
              For You
            </TabsTrigger>
            <TabsTrigger value="following" className="flex-1">
              Following
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Compose />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        {activeTab === 'for-you' ? (
          <Feed />
        ) : (
          <Feed type="following" />
        )}
      </motion.div>
    </motion.div>
  );
}
