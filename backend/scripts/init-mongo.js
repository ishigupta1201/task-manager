
// MongoDB initialization script for Docker
db = db.getSiblingDB('taskmanager');

// Create an admin user
db.createUser({
  user: 'taskmanager_admin',
  pwd: 'admin123',
  roles: [
    {
      role: 'readWrite',
      db: 'taskmanager'
    }
  ]
});

// Create collections with initial indexes
db.createCollection('users');
db.createCollection('tasks');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { "unique": true });
db.users.createIndex({ "role": 1 });
db.users.createIndex({ "isActive": 1 });

db.tasks.createIndex({ "assignedTo": 1, "status": 1 });
db.tasks.createIndex({ "createdBy": 1 });
db.tasks.createIndex({ "dueDate": 1 });
db.tasks.createIndex({ "status": 1, "priority": 1 });
db.tasks.createIndex({ "createdAt": -1 });

console.log('MongoDB initialization completed');
