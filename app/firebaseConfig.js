import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { getFirestore, collection, getDocs, query, where, doc, updateDoc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcs4ZxSFKh9EjQEIwZOPTfWk-Y8IiZeo0",
  authDomain: "control-doc-4959a.firebaseapp.com",
  projectId: "control-doc-4959a",
  storageBucket: "control-doc-4959a.appspot.com",
  messagingSenderId: "107828516986",
  appId: "1:107828516986:web:40f7eec3686ffed21f03c3"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

// Inicializar Firebase solo en el cliente
if (typeof window !== 'undefined') {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Verificar que Storage esté correctamente inicializado
    console.log("Firebase Storage bucket:", storage.app.options.storageBucket);
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
}

// Función para verificar si Firebase Storage está disponible
export const checkStorageAvailability = async () => {
  if (!storage) {
    console.error("Firebase Storage no está inicializado");
    return { available: false, error: "Firebase Storage no está inicializado" };
  }
  
  try {
    // Intentar crear una referencia de prueba
    const testRef = ref(storage, "test/availability_check.txt");
    
    // Crear un pequeño archivo de texto para probar
    const testBlob = new Blob(["Test de disponibilidad"], { type: "text/plain" });
    const testFile = new File([testBlob], "availability_check.txt", { type: "text/plain" });
    
    // Intentar subir el archivo
    await uploadBytes(testRef, testFile);
    
    // Si llegamos aquí, la subida fue exitosa
    console.log("Firebase Storage está disponible y funcionando correctamente");
    return { available: true };
  } catch (error) {
    console.error("Error al verificar disponibilidad de Firebase Storage:", error);
    return { 
      available: false, 
      error: error.message,
      code: error.code,
      details: error
    };
  }
}

// Constante para el rol de administrador
const ADMIN_ROLE = "DhHkVja";

// Función para verificar si un usuario es administrador
export const isAdmin = (user) => {
  return user && user.role === ADMIN_ROLE;
};

export { auth, db, storage, ADMIN_ROLE };

// LOS SERVICIOS

// Auth

// Login
export const onSigIn = async ({ email, password }) => {
  if (!auth) return null;
  
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    return res;
  } catch (error) {
    console.error("Error during sign in:", error);
    throw error;
  }
};

// Logout
export const logout = () => {
  if (!auth) return;
  signOut(auth);
};

// Login con Google
let googleProvider;
if (typeof window !== 'undefined') {
  googleProvider = new GoogleAuthProvider();
}

export const loginGoogle = async () => {
  if (!auth || !googleProvider) return null;
  
  try {
    const res = await signInWithPopup(auth, googleProvider);
    return res;
  } catch (error) {
    console.error("Error during Google sign in:", error);
    throw error;
  }
};

// Registro
export const signUp = async ({ email, password }) => {
  if (!auth) return null;
  
  try {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    return res;
  } catch (error) {
    console.error("Error during sign up:", error);
    throw error;
  }
};

// Olvidé la contraseña
export const forgotPassword = async (email) => {
  if (!auth) return null;
  
  try {
    const res = await sendPasswordResetEmail(auth, email);
    return res;
  } catch (error) {
    console.error("Error during password reset:", error);
    throw error;
  }
};

// Storage

export const uploadFile = async (file) => {
  if (!storage) {
    console.warn("Firebase Storage no está inicializado");
    return null;
  }
  
  try {
    console.log("Iniciando subida de archivo a Firebase Storage");
    
    // Crear una referencia única para el archivo
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `uploads/${fileName}`;
    console.log(`Ruta del archivo: ${filePath}`);
    
    const storageRef = ref(storage, filePath);
    
    // Subir el archivo
    console.log("Subiendo archivo...");
    const snapshot = await uploadBytes(storageRef, file);
    console.log("Archivo subido exitosamente:", snapshot);
    
    // Obtener la URL de descarga
    console.log("Obteniendo URL de descarga...");
    const url = await getDownloadURL(storageRef);
    console.log("URL obtenida:", url);
    
    return url;
  } catch (error) {
    console.error("Error durante la subida del archivo:", error);
    console.error("Detalles del error:", error.code, error.message);
    
    // Devolver null en lugar de lanzar el error para evitar que se rompa la aplicación
    return null;
  }
};

// Funciones para administradores

// Obtener todos los documentos subidos por los usuarios
export const getAllUserDocuments = async () => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Devolver datos de ejemplo o de localStorage para desarrollo
    const storedDocs = localStorage.getItem("userDocuments");
    return storedDocs ? JSON.parse(storedDocs) : [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, "userDocuments"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching user documents:", error);
    // En caso de error, intentar usar localStorage
    const storedDocs = localStorage.getItem("userDocuments");
    return storedDocs ? JSON.parse(storedDocs) : [];
  }
};

// Obtener todos los tipos de documentos requeridos
export const getAllRequiredDocuments = async () => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Devolver datos de ejemplo o de localStorage para desarrollo
    const storedDocs = localStorage.getItem("requiredDocuments");
    return storedDocs ? JSON.parse(storedDocs) : [];
  }
  
  try {
    const querySnapshot = await getDocs(collection(db, "requiredDocuments"));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching required documents:", error);
    // En caso de error, intentar usar localStorage
    const storedDocs = localStorage.getItem("requiredDocuments");
    return storedDocs ? JSON.parse(storedDocs) : [];
  }
};

// Esta función ha sido movida a la línea 635
const createRequiredDocumentOld = () => {
  console.warn("Esta función ha sido reemplazada. Por favor, use la versión actualizada.");
  return null;
};

// Esta función ha sido movida más adelante en el archivo
const getUserDocumentsOld = () => {
  console.warn("Esta función ha sido reemplazada. Por favor, use la versión actualizada.");
  return [];
};

// Obtener documentos requeridos para una empresa específica
export const getCompanyRequiredDocuments = async (companyId) => {
  if (!db || !companyId) {
    console.warn("Firestore no está inicializado o companyId no proporcionado");
    // Devolver datos de localStorage para desarrollo
    const storedDocs = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
    return storedDocs.filter(doc => doc.companyId === companyId);
  }
  
  try {
    const q = query(collection(db, "requiredDocuments"), where("companyId", "==", companyId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error fetching required documents for company ${companyId}:`, error);
    // En caso de error, intentar usar localStorage
    const storedDocs = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
    return storedDocs.filter(doc => doc.companyId === companyId);
  }
};

// Esta función ha sido movida a la línea 661
const uploadUserDocumentOld = () => {
  console.warn("Esta función ha sido reemplazada. Por favor, use la versión actualizada.");
  return null;
};

// Aprobar un documento
export const approveDocument = async (documentId) => {
  try {
    await updateDoc(doc(db, "userDocuments", documentId), { 
      status: "approved",
      approvedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error(`Error approving document ${documentId}:`, error);
    throw error;
  }
};

// Verificar si un documento está vencido
export const isDocumentExpired = (document, requiredDocument) => {
  if (!document.approvedAt) return false;
  
  const approvedDate = new Date(document.approvedAt);
  const today = new Date();
  const { deadline } = requiredDocument;
  
  if (deadline.type === "monthly" && deadline.day) {
    // Verificar si ha pasado un mes desde la aprobación
    const nextDeadline = new Date(approvedDate);
    nextDeadline.setMonth(nextDeadline.getMonth() + 1);
    return today > nextDeadline;
  } else if (deadline.type === "biannual" && deadline.months) {
    // Verificar si estamos en un mes posterior al siguiente mes de vencimiento
    const currentMonth = today.getMonth() + 1; // 1-12
    const approvedMonth = approvedDate.getMonth() + 1; // 1-12
    
    // Encontrar el próximo mes de vencimiento después del mes de aprobación
    const nextDeadlineMonth = deadline.months.find(month => month > approvedMonth) || deadline.months[0];
    
    // Si estamos en un año posterior o en el mismo año pero en/después del mes de vencimiento
    if (today.getFullYear() > approvedDate.getFullYear()) {
      return true;
    } else if (today.getFullYear() === approvedDate.getFullYear() && currentMonth >= nextDeadlineMonth) {
      return true;
    }
    
    return false;
  } else if (deadline.type === "custom" && deadline.date) {
    // Verificar si la fecha actual es posterior a la fecha de vencimiento
    const deadlineDate = new Date(deadline.date);
    return today > deadlineDate;
  }
  
  return false;
};

// Rechazar un documento
export const rejectDocument = async (documentId, reason) => {
  if (!db) return null;
  
  try {
    const docRef = doc(db, "userDocuments", documentId);
    await updateDoc(docRef, {
      status: "rejected",
      rejectionReason: reason,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error rejecting document:", error);
    return false;
  }
};

// Obtener todas las compañías de un administrador
export const getAdminCompanies = async (adminId) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Obtener de localStorage para desarrollo
    try {
      const allCompanies = JSON.parse(localStorage.getItem("companies") || "[]");
      return allCompanies.filter(company => company.adminId === adminId);
    } catch (error) {
      console.error("Error getting companies from localStorage:", error);
      return [];
    }
  }
  
  try {
    // Obtener compañías de Firestore filtradas por adminId
    const companiesRef = collection(db, "companies");
    const q = query(companiesRef, where("adminId", "==", adminId));
    const querySnapshot = await getDocs(q);
    
    // Convertir los documentos de Firestore a objetos de compañía
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting companies from Firestore:", error);
    return [];
  }
};

// Crear una nueva compañía
export const createCompany = async (companyData) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Crear en localStorage para desarrollo
    try {
      const newCompany = {
        id: `company_${Date.now()}`,
        ...companyData,
        createdAt: new Date().toISOString()
      };
      
      const companies = JSON.parse(localStorage.getItem("companies") || "[]");
      companies.push(newCompany);
      localStorage.setItem("companies", JSON.stringify(companies));
      
      return newCompany;
    } catch (error) {
      console.error("Error creating company in localStorage:", error);
      throw error;
    }
  }
  
  try {
    // Crear compañía en Firestore
    const docRef = await addDoc(collection(db, "companies"), {
      ...companyData,
      createdAt: new Date().toISOString()
    });
    
    // Devolver la compañía creada con su ID
    return {
      id: docRef.id,
      ...companyData
    };
  } catch (error) {
    console.error("Error creating company in Firestore:", error);
    throw error;
  }
};

// Eliminar una compañía
export const deleteCompany = async (companyId) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Eliminar de localStorage para desarrollo
    try {
      const companies = JSON.parse(localStorage.getItem("companies") || "[]");
      const filteredCompanies = companies.filter(company => company.id !== companyId);
      localStorage.setItem("companies", JSON.stringify(filteredCompanies));
      return true;
    } catch (error) {
      console.error("Error deleting company from localStorage:", error);
      return false;
    }
  }
  
  try {
    // Eliminar la compañía de Firestore
    const companyRef = doc(db, "companies", companyId);
    await deleteDoc(companyRef);
    
    // También eliminar los documentos requeridos asociados a esta compañía
    const requiredDocsRef = collection(db, "requiredDocuments");
    const q = query(requiredDocsRef, where("companyId", "==", companyId));
    const querySnapshot = await getDocs(q);
    
    // Eliminar cada documento requerido
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    
    // Ejecutar el batch
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error("Error deleting company:", error);
    return false;
  }
};

// Obtener documentos requeridos para una compañía
export const getRequiredDocuments = async (companyId) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Obtener de localStorage para desarrollo
    try {
      const allDocuments = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
      return allDocuments.filter(doc => doc.companyId === companyId);
    } catch (error) {
      console.error("Error getting required documents from localStorage:", error);
      return [];
    }
  }
  
  try {
    // Obtener documentos requeridos de Firestore filtrados por companyId
    const requiredDocsRef = collection(db, "requiredDocuments");
    const q = query(requiredDocsRef, where("companyId", "==", companyId));
    const querySnapshot = await getDocs(q);
    
    // Convertir los documentos de Firestore a objetos
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting required documents from Firestore:", error);
    return [];
  }
};

// Crear un nuevo documento requerido
export const createRequiredDocument = async (documentData) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Crear en localStorage para desarrollo
    try {
      const newDocument = {
        id: `doc_${Date.now()}`,
        ...documentData,
        createdAt: new Date().toISOString()
      };
      
      const documents = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
      documents.push(newDocument);
      localStorage.setItem("requiredDocuments", JSON.stringify(documents));
      
      return newDocument;
    } catch (error) {
      console.error("Error creating required document in localStorage:", error);
      throw error;
    }
  }
  
  try {
    // Crear documento requerido en Firestore
    const docRef = await addDoc(collection(db, "requiredDocuments"), {
      ...documentData,
      createdAt: new Date().toISOString()
    });
    
    // Devolver el documento creado con su ID
    return {
      id: docRef.id,
      ...documentData
    };
  } catch (error) {
    console.error("Error creating required document in Firestore:", error);
    throw error;
  }
};

// Eliminar un documento requerido
export const deleteRequiredDocument = async (documentId) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Eliminar de localStorage para desarrollo
    try {
      const documents = JSON.parse(localStorage.getItem("requiredDocuments") || "[]");
      const filteredDocuments = documents.filter(doc => doc.id !== documentId);
      localStorage.setItem("requiredDocuments", JSON.stringify(filteredDocuments));
      return true;
    } catch (error) {
      console.error("Error deleting required document from localStorage:", error);
      return false;
    }
  }
  
  try {
    // Eliminar el documento requerido de Firestore
    const documentRef = doc(db, "requiredDocuments", documentId);
    await deleteDoc(documentRef);
    return true;
  } catch (error) {
    console.error("Error deleting required document:", error);
    return false;
  }
};

// Subir un documento de usuario
export const uploadUserDocument = async (documentData, file) => {
  if (!db || !storage) {
    console.warn("Firestore o Storage no están inicializados");
    // Fallback a localStorage para desarrollo
    try {
      const newDocument = {
        id: `upload_${Date.now()}`,
        ...documentData,
        status: "pending",
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        fileUrl: URL.createObjectURL(file) // Esto solo funciona en desarrollo
      };
      
      const uploads = JSON.parse(localStorage.getItem("userUploads") || "[]");
      uploads.push(newDocument);
      localStorage.setItem("userUploads", JSON.stringify(uploads));
      
      return newDocument;
    } catch (error) {
      console.error("Error saving upload to localStorage:", error);
      throw error;
    }
  }
  
  try {
    // 1. Subir el archivo a Firebase Storage
    const { ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
    
    // Crear una referencia única para el archivo
    const storageRef = ref(storage, `uploads/${documentData.companyId}/${documentData.requiredDocumentId}/${Date.now()}_${file.name}`);
    
    // Subir el archivo
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Esperar a que se complete la subida
    const snapshot = await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snapshot) => {
          // Progreso de la subida
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          // Error
          console.error("Error uploading file:", error);
          reject(error);
        }, 
        () => {
          // Completado
          resolve(uploadTask.snapshot);
        }
      );
    });
    
    // Obtener la URL de descarga
    const fileUrl = await getDownloadURL(snapshot.ref);
    
    // 2. Guardar los datos del documento en Firestore
    const uploadData = {
      ...documentData,
      status: "pending",
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      fileUrl: fileUrl
    };
    
    const docRef = await addDoc(collection(db, "uploadedDocuments"), uploadData);
    
    return {
      id: docRef.id,
      ...uploadData
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

// Obtener documentos subidos por un usuario
export const getUserDocuments = async (userId, companyId = null) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Fallback a localStorage para desarrollo
    try {
      const uploads = JSON.parse(localStorage.getItem("userUploads") || "[]");
      let filteredUploads = uploads.filter(doc => doc.userId === userId);
      
      if (companyId) {
        filteredUploads = filteredUploads.filter(doc => doc.companyId === companyId);
      }
      
      return filteredUploads;
    } catch (error) {
      console.error("Error getting user documents from localStorage:", error);
      return [];
    }
  }
  
  try {
    // Consultar documentos de Firestore filtrados por userId
    const uploadsRef = collection(db, "uploadedDocuments");
    let q;
    
    if (companyId) {
      q = query(uploadsRef, 
        where("userId", "==", userId),
        where("companyId", "==", companyId)
      );
    } else {
      q = query(uploadsRef, where("userId", "==", userId));
    }
    
    const querySnapshot = await getDocs(q);
    
    // Convertir los documentos de Firestore a objetos
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting user documents from Firestore:", error);
    return [];
  }
};

// Actualizar el estado de un documento subido
export const updateDocumentStatus = async (documentId, status, expirationDate = null, comments = null) => {
  if (!db) {
    console.warn("Firestore no está inicializado");
    // Fallback a localStorage para desarrollo
    try {
      const uploads = JSON.parse(localStorage.getItem("userUploads") || "[]");
      const updatedUploads = uploads.map(doc => {
        if (doc.id === documentId) {
          return {
            ...doc,
            status,
            ...(status === "approved" && { 
              approvedAt: new Date().toISOString(),
              expirationDate: expirationDate || null
            }),
            ...(status === "rejected" && { 
              rejectedAt: new Date().toISOString(),
              rejectionComments: comments || ""
            })
          };
        }
        return doc;
      });
      
      localStorage.setItem("userUploads", JSON.stringify(updatedUploads));
      return true;
    } catch (error) {
      console.error("Error updating document status in localStorage:", error);
      return false;
    }
  }
  
  try {
    // Actualizar el documento en Firestore
    const documentRef = doc(db, "uploadedDocuments", documentId);
    
    const updateData = {
      status,
      ...(status === "approved" && { 
        approvedAt: new Date().toISOString(),
        expirationDate: expirationDate || null
      }),
      ...(status === "rejected" && { 
        rejectedAt: new Date().toISOString(),
        rejectionComments: comments || ""
      })
    };
    
    await updateDoc(documentRef, updateData);
    return true;
  } catch (error) {
    console.error("Error updating document status:", error);
    return false;
  }
};

// Obtener documentos vencidos o próximos a vencer para un usuario
export const getExpiredDocuments = async (userId, companyId) => {
  try {
    // 1. Obtener todos los documentos requeridos para la empresa
    const requiredDocs = await getRequiredDocuments(companyId);
    
    // 2. Obtener todos los documentos subidos por el usuario
    const userDocs = await getUserDocuments(userId, companyId);
    
    // 3. Para cada documento requerido, verificar si el usuario tiene un documento válido
    const results = [];
    
    for (const requiredDoc of requiredDocs) {
      // Buscar el documento más reciente del usuario para este tipo de documento requerido
      const userDocsForType = userDocs
        .filter(doc => doc.requiredDocumentId === requiredDoc.id && doc.status === "approved")
        .sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());
      
      const latestDoc = userDocsForType[0];
      
      if (!latestDoc || isDocumentExpired(latestDoc, requiredDoc)) {
        results.push({
          requiredDocument: requiredDoc,
          userDocument: latestDoc || null,
          status: !latestDoc ? "missing" : "expired"
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error getting expired documents for user ${userId}:`, error);
    throw error;
  }
};
