"use client";
import React from "react";
import { motion } from "framer-motion";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: typeof testimonials;
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6 bg-background"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, avatar, name, role, mentor }, i) => (
                <div className="p-10 rounded-3xl border shadow-lg shadow-primary/10 max-w-xs w-full" key={i}>
                  <div className="text-sm leading-relaxed">{text}</div>
                  <div className="flex items-center gap-2 mt-5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-600 to-gray-800 flex items-center justify-center text-white font-semibold text-sm">
                      {avatar}
                    </div>
                    <div className="flex flex-col">
                      <div className="font-medium tracking-tight leading-5">{name}</div>
                      <div className="leading-5 opacity-60 tracking-tight text-xs">{role}</div>
                    </div>
                  </div>
                  {mentor && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-600">
                        <span className="font-medium">Mentor:</span> {mentor}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};

const testimonials = [
  {
    text: "Before joining, I wasn't that confident about interviews for on-camera roles, though I did have good enough understanding of concepts but 'what I don't know' was stopping me to apply for such roles. Ma'am made it realised that it's an iterative process, I'll learn to tackle my loopholes by actually giving interviews.",
    avatar: "RV",
    name: "Rahul Vansh",
    role: "Student",
    mentor: "Megha Upadhyay - Ex-ABP News",
  },
  {
    text: "Just wanted to say a big thank you for your insightful guidance. Your clear advice on improving my speaking and writing skills was exactly what I needed. I appreciate your genuine interest in my growth, and I'm excited to start working on your suggestions.",
    avatar: "PM",
    name: "Pradeep M",
    role: "Student",
    mentor: "Ajatika Singh - ABP News",
  },
  {
    text: "Happy to talk to you!! I loved the way she was clearing my doubts related to my career. She is frank, loving and motivating person. I recommend everyone to take advice from her as she is very genuine and realistic in nature.",
    avatar: "KS",
    name: "Kirti Sharma",
    role: "Student",
    mentor: "Megha Upadhyay - Ex-ABP News",
  },
  {
    text: "I recently had a conversation with Megha Didi who guided me regarding my career and shared valuable advice. She patiently answered all my questions and motivated me to work hard and stay focused. The guidance I received has given me clarity and confidence to move forward in life. I am truly grateful for their time and support. Thank you so much didi for being such a positive influence.🙏🏻❤️",
    avatar: "AP",
    name: "Abhijeet Pathak",
    role: "Student",
    mentor: "Megha Upadhyay - Ex-ABP News",
  },
  {
    text: "The call is really worth it. And very helpful. I could say she is the best person to guide in the career.",
    avatar: "HK",
    name: "Harjeet Kaur",
    role: "Student",
    mentor: "Ajatika Singh - ABP News",
  },
  {
    text: "It was nice talking to Megha. She patiently clarified each and every doubt I had. Thank you, Megha.",
    avatar: "AR",
    name: "Arvind",
    role: "Student",
    mentor: "Megha Upadhyay - Ex-ABP News",
  },
  {
    text: "The session was extremely wonderful! Being a fresher it always seems to be hard or almost impossible to get in touch with the people who are already on a good note or position. It was truly grateful of ma'am, the way she thought and explained me the things in such a friendly and easy manner that made me comfortable to express and put on my points and queries freely.",
    avatar: "SS",
    name: "Shruti Suman",
    role: "Student",
    mentor: "Megha Upadhyay - Ex-ABP News",
  },
  {
    text: "It was nice talking to Ajatika Ma'am. She patiently clarified each and every doubt I had. Thank you ma'am.",
    avatar: "SS",
    name: "Sunny Shukla",
    role: "Student",
    mentor: "Ajatika Singh - ABP News",
  },
];
