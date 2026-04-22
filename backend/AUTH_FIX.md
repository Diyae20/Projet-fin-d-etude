
# Fix for Authentication Issues

## Problem
The login endpoint `/api/auth/login/` is returning 401 Unauthorized errors.

## Solution
The issue is likely that there are no users in the database with valid credentials. Follow these steps to fix it:

### Step 1: Create Test Users
Run the following command to create test users for each role:

```bash
python manage.py create_test_users
```

This will create the following test users:

1. **Superuser (Admin)**
   - Username: `admin`
   - Password: `admin123`
   - Role: admin

2. **Doctor**
   - Username: `medecin1`
   - Password: `medecin123`
   - Role: medecin

3. **Receptionist**
   - Username: `reception1`
   - Password: `reception123`
   - Role: reception

4. **Patient**
   - Username: `patient1`
   - Password: `patient123`
   - Role: patient

### Step 2: Test Login
Try logging in with any of these test accounts in your frontend application.

### Step 3: Verify Authentication
After logging in, you should be redirected to the appropriate dashboard based on your role:

- Admin: Home page
- Doctor: `/dashboard/medecin`
- Receptionist: `/reception/dashboard`
- Patient: Home page

### Step 4: Check Token Authentication
The system uses Token Authentication. When a user logs in, a token is generated and stored in the localStorage. This token is used for all subsequent API requests.

If you're still experiencing issues, check the following:

1. Make sure the backend server is running on port 8000
2. Verify that the frontend proxy is correctly configured in `package.json`
3. Check the browser console for any error messages
4. Verify that the CORS settings in `settings.py` allow requests from your frontend URL

### Additional Notes
- The test users are created with authentication tokens automatically
- You can create additional users through the registration page in the frontend
- For production, make sure to change the default passwords and use strong authentication
