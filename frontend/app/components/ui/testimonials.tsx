import { TestimonialsColumn } from "./testimonials-columns-1";
import { motion } from "framer-motion";

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

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

const Testimonials = () => {
  return (
    <section id="success-stories" className="my-10 relative z-10" style={{ backgroundColor: '#F3E8DF' }}>
      <div className="container z-10 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-col items-center justify-center max-w-[540px] mx-auto"
        >
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tighter">
            What our students say
          </h2>
          <p className="text-center mt-5 opacity-75">
            Real testimonials from students who transformed their communication skills.
          </p>
        </motion.div>

        <div className="flex justify-center gap-6 mt-10 [mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)] max-h-[700px] overflow-hidden">
          <TestimonialsColumn testimonials={firstColumn} duration={15} />
          <TestimonialsColumn testimonials={secondColumn} className="hidden md:block" duration={19} />
          <TestimonialsColumn testimonials={thirdColumn} className="hidden lg:block" duration={17} />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
