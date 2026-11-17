import Intro from '@/components/Intro';
import Header from '@/components/Header';
import Journey from '@/components/Journey';
import Projects from '@/components/Projects';
import VillaPlan from '@/components/VillaPlan';
import Process from '@/components/Process';
import Why from '@/components/Why';
import Philosophy from '@/components/Philosophy';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import ScrollReveal from '@/components/ScrollReveal';
import ProjectImagesProvider from '@/components/ProjectImages';

export default function Home() {
  return (
    <ProjectImagesProvider>
      <Intro />
      <Header />
      <main>
        <Journey />
        <Projects />
        <VillaPlan />
        <Process />
        <Why />
        <Philosophy />
        <Contact />
      </main>
      <Footer />
      <ScrollReveal />
    </ProjectImagesProvider>
  );
}
