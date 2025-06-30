'use client';
// Ce fichier contient le composant principal du tableau de bord
// Il gère l'affichage et la manipulation des tâches

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Configuration d'axios pour inclure les cookies
axios.defaults.withCredentials = true;

// Type pour les tâches
type Task = {
  id: number;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

// Types pour le filtrage et le tri
type FilterStatus = 'toutes' | 'accomplies' | 'non accomplie';
type SortBy = 'date' | 'statut';

export default function DashboardPage() {
  // Hooks pour la navigation et l'état
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editTaskId, setEditTaskId] = useState<number | null>(null);
  // États pour le filtrage et le tri
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('toutes');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  // État pour la fenêtre modale et l'affichage des descriptions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  // État pour le menu déroulant ouvert
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  // État pour le nom de l'utilisateur (placeholder)
  const [userName, setUserName] = useState(''); // Initialisé à vide
  // État pour le menu hamburger/barre latérale sur mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Détermine le message de salutation en fonction de l'heure
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const greeting = getGreeting();

  // Fonction pour récupérer toutes les tâches
  const fetchTasks = async () => {
    try {
      const res = await axios.get('/api/tasks');
      setTasks(res.data);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      // Gérer l'erreur (par exemple, rediriger vers la page de connexion si 401)
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  // Fonction pour récupérer les informations de l'utilisateur
  const fetchUser = async () => {
    try {
      const res = await axios.get('/api/user');
      setUserName(res.data.name); // Utiliser le nom de l'utilisateur récupéré
    } catch (error) {
      console.error('Erreur lors du chargement des informations utilisateur:', error);
      // Gérer l'erreur (par exemple, rediriger vers la page de connexion si 401)
       if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  // Fonction pour ajouter ou mettre à jour une tâche
  const handleAddOrUpdateTask = async () => {
    if (!title) return; // Titre est obligatoire

    if (editMode && editTaskId !== null) {
      // Mode édition : met à jour la tâche existante
      await axios.patch(`/api/tasks/${editTaskId}`, {
        title,
        description,
      });
      setEditMode(false);
      setEditTaskId(null);
    } else {
      // Mode création : ajoute une nouvelle tâche
      await axios.post('/api/tasks', {
        title,
        description,
      });
    }

    // Réinitialise les champs et ferme la modale
    setTitle('');
    setDescription('');
    setIsModalOpen(false); // Ferme la modale après ajout/modification
    fetchTasks();
  };

  // Fonction pour passer en mode édition d'une tâche
  const handleEdit = (task: Task) => {
    setTitle(task.title);
    setDescription(task.description);
    setEditTaskId(task.id);
    setEditMode(true);
    setIsModalOpen(true); // Ouvre la modale en mode édition
  };

  // Fonction pour basculer l'affichage de la description d'une tâche
  const toggleDescription = (taskId: number) => {
    const newExpandedTasks = new Set(expandedTasks);
    if (newExpandedTasks.has(taskId)) {
      newExpandedTasks.delete(taskId);
    } else {
      newExpandedTasks.add(taskId);
    }
    setExpandedTasks(newExpandedTasks);
  };

  // Fonction pour basculer le statut d'une tâche
  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'accomplie' ? 'non accomplie' : 'accomplie';
    await axios.patch(`/api/tasks/${task.id}`, { status: newStatus });
    fetchTasks();
  };

  // Fonction pour supprimer une tâche
  const handleDelete = async (id: number) => {
    await axios.delete(`/api/tasks/${id}`);
    fetchTasks();
  };

  // Fonction pour se déconnecter
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Fonction pour basculer le menu déroulant d'une tâche
  const toggleDropdown = (taskId: number) => {
    setOpenDropdownId(openDropdownId === taskId ? null : taskId);
  };

  // Fonction pour basculer l'ouverture/fermeture de la barre latérale
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Charge les tâches et les informations utilisateur au montage du composant
  useEffect(() => {
    fetchTasks();
    fetchUser(); // Appeler la fonction pour récupérer l'utilisateur
  }, []); // Effectuer une seule fois au montage

  // Filtrer les tâches
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = 
      filterStatus === 'toutes' ? true :
      filterStatus === 'accomplies' ? task.status === 'accomplie' :
      task.status === 'non accomplie';

    const matchesDate = selectedDate ? 
      new Date(task.createdAt).toLocaleDateString() === new Date(selectedDate).toLocaleDateString() :
      true;

    return matchesStatus && matchesDate;
  });

  // Trier les tâches
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else {
      // Tri par statut : Non accomplies d'abord, puis Accomplies
      if (a.status === 'non accomplie' && b.status === 'accomplie') return -1;
      if (a.status === 'accomplie' && b.status === 'non accomplie') return 1;
      return 0;
    }
  });

  // Compte les tâches accomplies et non accomplies
  const completedCount = tasks.filter(t => t.status === 'accomplie').length;
  const incompleteCount = tasks.filter(t => t.status === 'non accomplie').length;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">
      {/* Hamburger Button (Visible on small screens) */}
      <button className="md:hidden p-4 focus:outline-none" onClick={toggleSidebar}>
        {/* Simple hamburger icon (you can replace with an SVG icon) */}
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white p-6 shadow-md flex flex-col justify-between z-50 transform ${isSidebarOpen ? 'translate-x-0 ease-out' : '-translate-x-full ease-in'} md:relative md:translate-x-0 md:flex h-full`}>
        <div>
          <h2 className="text-lg font-bold mb-4">Private</h2>
          {/* Add private list items here */}
          <h2 className="text-lg font-bold mt-6 mb-4">Group</h2>
          {/* Add group list items here */}
        </div>
        {/* Bouton de déconnexion en bas de la barre latérale */}
        <button
          onClick={handleLogout}
          className="mt-8 px-4 py-2 bg-red-600 text-white rounded text-center"
        >
          Se déconnecter
        </button>
      </div>

      {/* Overlay when sidebar is open on small screens */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar} // Click on overlay to close sidebar
        ></div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col py-8 px-4 md:px-8 relative">
        {/* Centered content wrapper */}
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-gray-700">{greeting}, </span>
                <span className="text-black">{userName}!</span>
              </h1>
              <p className="text-gray-600">Today, Wed 26 July 2023</p>
            </div>
            {/* Filter/Sort - Placeholder */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center px-3 py-1 border rounded">
                <span className="mr-1">✓</span> Today
              </button>
              <button className="px-3 py-1 border rounded">=</button>
            </div>
          </div>

          {/* Filter and Sort Controls */}
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm">Filtrer par statut :</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="border rounded px-2 py-1"
              >
                <option value="toutes">Toutes</option>
                <option value="accomplies">Accomplies</option>
                <option value="non accomplie">Non accomplies</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm">Filtrer par date :</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-2 py-1"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-sm text-red-500"
                >
                  Effacer
                </button>
              )}
            </div>

            {/* Task Counts (Optional) */}
            {/* <div className="text-sm text-gray-700">
              <span>✅ Accomplies : {completedCount}</span> |{' '}
              <span>📋 Non accomplies : {incompleteCount}</span>
            </div> */}
          </div>

          {/* Task List */}
          <div className="overflow-y-scroll scrollbar-hide flex-1">
            <ul>
              {sortedTasks.map(task => (
                <li key={task.id} className="bg-white p-4 mb-3 rounded shadow flex items-center justify-between">
                  {/* Clickable area for toggling description */}
                  <div className="flex items-start flex-grow cursor-pointer" onClick={() => toggleDescription(task.id)}>
                    {/* Checkbox - prevent click from toggling description */}
                    <input
                      type="checkbox"
                      checked={task.status === 'accomplie'}
                      onChange={(e) => { e.stopPropagation(); handleToggleStatus(task); }}
                      className="mr-3 cursor-pointer"
                    />
                    {/* Task Title and Description Area */}
                    <div className="flex-grow">
                      {/* Task Title */}
                      <h3 className={`font-medium ${task.status === 'accomplie' ? 'line-through text-gray-500' : 'text-black'}`}>
                         {task.title}
                      </h3>
                      {/* Description - conditionally displayed */}
                      {expandedTasks.has(task.id) && (
                         <p className="text-sm text-gray-700 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                  {/* Time and Options (keep outside clickable area) */}
                  <div className="flex items-center space-x-4 flex-shrink-0">
                    {/* Placeholder for Time */}
                    <span className="text-sm text-gray-500">09.00 - 11.00</span>
                    {/* Options Button with Dropdown */}
                    <div className="relative">
                      <button className="text-gray-400 hover:text-gray-600" onClick={() => toggleDropdown(task.id)}>
                        ...
                      </button>
                      {/* Dropdown Menu */}
                      {openDropdownId === task.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                          <button
                            onClick={() => { handleEdit(task); setOpenDropdownId(null); }} // Close dropdown on click
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            Modifier
                          </button>
                          <button
                            onClick={() => { handleDelete(task.id); setOpenDropdownId(null); }} // Close dropdown on click
                            className="block px-4 py-2 text-sm text-red-700 hover:bg-gray-100 w-full text-left"
                          >
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Add New Task Button at the bottom */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 px-4 w-full max-w-md">
          <button
            onClick={() => {
              setEditMode(false); // S'assurer qu'on est en mode création
              setEditTaskId(null);
              setTitle(''); // Réinitialiser les champs
              setDescription('');
              setIsModalOpen(true); // Ouvre la modale
            }}
            className="bg-black text-white text-lg px-6 py-3 rounded-full shadow-lg flex items-center space-x-2"
          >
            <span className="text-xl">+</span>
            <span>Create new task</span>
            <span className="text-gray-400 ml-4">⌘ N</span>
          </button>
        </div>

        {/* Right Sidebar Button - Placeholder */}
        <button className="absolute bottom-8 right-8 bg-white p-4 rounded-full shadow-lg">
          📄
        </button>

        {/* Task Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
              <h2 className="text-xl font-bold mb-4">{editMode ? 'Modifier Tâche' : 'Créer Nouvelle Tâche'}</h2>
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">Titre</label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description (Optionnel)</label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                ></textarea>
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsModalOpen(false)} // Ferme la modale sans sauvegarder
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddOrUpdateTask}
                  className={`px-4 py-2 text-white rounded-md ${editMode ? 'bg-green-600' : 'bg-blue-600'}`}
                >
                  {editMode ? 'Sauvegarder' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
