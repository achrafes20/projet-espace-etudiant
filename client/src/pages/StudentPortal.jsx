import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, ArrowRightIcon, ShieldCheckIcon, BoltIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import Header from '../components/Header';
import Hero3D from '../components/Hero3D';

const StudentPortal = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col bg-hero">
            <Header />
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
                <section className="relative overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
                        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary-700/15 blur-3xl" />
                    </div>

                    <div className="relative card-glass p-8 md:p-12">
                        <div className="grid lg:grid-cols-12 gap-10 items-center">
                            <motion.div
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55 }}
                                className="lg:col-span-7"
                            >
                                <div className="inline-flex items-center gap-2 rounded-full bg-white/60 border border-white/70 px-3 py-1 text-xs font-semibold text-gray-700">
                                    <SparklesIcon className="h-4 w-4 text-primary-700" />
                                    Nouveau design • ultra fluide • 3D légère
                                </div>

                                <h2 className="mt-5 text-4xl md:text-5xl font-extrabold tracking-tight title-gradient">
                                    Portail des Services Étudiants
                                </h2>
                                <p className="mt-4 text-gray-700 text-lg leading-relaxed max-w-2xl">
                                    Demandez vos attestations, relevés et conventions en quelques clics, suivez l’état en temps réel,
                                    et déposez une réclamation si besoin — le tout avec une expérience rapide, claire et moderne.
                                </p>

                                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                                    <button onClick={() => navigate('/request')} className="btn-primary">
                                        Démarrer une demande <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                                    </button>
                                    <button onClick={() => navigate('/status')} className="btn-secondary">
                                        Suivre ma demande
                                    </button>
                                </div>

                                <div className="mt-10 grid sm:grid-cols-3 gap-4">
                                    <div className="surface-solid rounded-2xl p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <BoltIcon className="h-5 w-5 text-primary-700" /> Rapide
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">Chargement optimisé + routes lazy.</p>
                                    </div>
                                    <div className="surface-solid rounded-2xl p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <ShieldCheckIcon className="h-5 w-5 text-primary-700" /> Fiable
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">Statuts, références et infos claires.</p>
                                    </div>
                                    <div className="surface-solid rounded-2xl p-4">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                                            <DocumentTextIcon className="h-5 w-5 text-primary-700" /> Centralisé
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">Tous les services au même endroit.</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.55, delay: 0.08 }}
                                className="lg:col-span-5"
                            >
                                <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white/40 border border-white/60 shadow-[0_20px_70px_-40px_rgba(2,132,199,0.75)]">
                                    <Hero3D className="absolute inset-0" />
                                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-white/40 via-transparent to-transparent" />
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                <section className="mt-10 grid md:grid-cols-3 gap-6">
                    <div className="card-glass">
                        <h3 className="section-title">Demande de document</h3>
                        <p className="text-sm text-gray-600">
                            Attestation de scolarité / réussite, relevé de notes, convention de stage.
                        </p>
                        <button onClick={() => navigate('/request')} className="btn-primary mt-5 w-full">
                            Accéder <ArrowRightIcon className="h-5 w-5 ml-2 inline" />
                        </button>
                    </div>
                    <div className="card-glass">
                        <h3 className="section-title">Suivi en ligne</h3>
                        <p className="text-sm text-gray-600">
                            Entrez votre référence + email pour voir le statut en quelques secondes.
                        </p>
                        <button onClick={() => navigate('/status')} className="btn-secondary mt-5 w-full">
                            Suivre
                        </button>
                    </div>
                    <div className="card-glass">
                        <h3 className="section-title">Réclamation</h3>
                        <p className="text-sm text-gray-600">
                            Un souci ? Envoyez une réclamation liée à une référence de demande.
                        </p>
                        <button onClick={() => navigate('/complaint')} className="btn-secondary mt-5 w-full">
                            Déposer
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StudentPortal;
