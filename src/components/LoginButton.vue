<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { authClient } from '../lib/auth-client';

const user = ref<any>(null);
const loading = ref(true);

const checkSession = async () => {
	try {
		const session = await authClient.getSession();
		if (session.data) {
			user.value = session.data.user;
		}
	} catch (error) {
		console.error('Session check error:', error);
	} finally {
		loading.value = false;
	}
};

const signInWithGoogle = async () => {
	try {
		await authClient.signIn.social({
			provider: 'google',
			callbackURL: '/login'
		});
	} catch (error) {
		console.error('Login error:', error);
	}
};

const signOut = async () => {
	try {
		await authClient.signOut();
		user.value = null;
	} catch (error) {
		console.error('Logout error:', error);
	}
};

onMounted(() => {
	checkSession();
});
</script>

<template>
	<div class="auth-container">
		<div class="content-wrapper" :class="{ 'is-loading': loading }">
			<div v-show="loading" class="loading">
				<div class="spinner"></div>
				<p>読み込み中...</p>
			</div>

			<div v-show="!loading && user" class="user-info">
				<h2>ログイン成功！</h2>
				<div class="user-card">
					<div class="avatar-wrapper">
						<img v-if="user?.image" :src="user.image" :alt="user.name" class="avatar" width="100" height="100" />
					</div>
					<div class="user-details">
						<p><strong>名前:</strong> {{ user?.name }}</p>
						<p><strong>メール:</strong> {{ user?.email }}</p>
						<p><strong>ユーザーID:</strong> {{ user?.id }}</p>
					</div>
				</div>
				<button @click="signOut" class="btn btn-danger">ログアウト</button>
			</div>

			<div v-show="!loading && !user" class="login-prompt">
				<h2>ログインテスト</h2>
				<p>Googleアカウントでログインしてください</p>
				<button @click="signInWithGoogle" class="btn btn-google">
					<svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
						<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
						<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
						<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
						<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
						<path fill="none" d="M0 0h48v48H0z"/>
					</svg>
					Googleでログイン
				</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.auth-container {
	max-width: 600px;
	margin: 0 auto;
	padding: 2rem;
}

.content-wrapper {
	min-height: 400px;
	position: relative;
}

.content-wrapper > div {
	opacity: 1;
	transition: opacity 0.3s ease;
}

.content-wrapper.is-loading > div:not(.loading) {
	opacity: 0;
	pointer-events: none;
}

.loading {
	text-align: center;
	padding: 2rem;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 400px;
}

.loading p {
	font-size: 1.2rem;
	color: #666;
	margin-top: 1rem;
}

.spinner {
	width: 48px;
	height: 48px;
	border: 4px solid #f3f3f3;
	border-top: 4px solid #667eea;
	border-radius: 50%;
	animation: spin 1s linear infinite;
}

@keyframes spin {
	0% { transform: rotate(0deg); }
	100% { transform: rotate(360deg); }
}

.login-prompt {
	text-align: center;
	padding: 2rem;
	background: #f9f9f9;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	min-height: 300px;
	display: flex;
	flex-direction: column;
	justify-content: center;
}

.login-prompt h2 {
	margin: 0 0 1rem 0;
	color: #333;
}

.login-prompt p {
	margin: 0 0 2rem 0;
	color: #666;
}

.user-info {
	text-align: center;
}

.user-info h2 {
	color: #34A853;
	margin: 0 0 2rem 0;
}

.user-card {
	background: white;
	padding: 2rem;
	border-radius: 12px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	margin-bottom: 2rem;
}

.avatar-wrapper {
	width: 100px;
	height: 100px;
	margin: 0 auto 1rem auto;
	border-radius: 50%;
	background: #f0f0f0;
	overflow: hidden;
}

.avatar {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}

.user-details {
	text-align: left;
	margin: 0 auto;
	max-width: 400px;
}

.user-details p {
	margin: 0.75rem 0;
	padding: 0.5rem;
	background: #f5f5f5;
	border-radius: 6px;
	word-break: break-all;
}

.btn {
	padding: 0.75rem 2rem;
	font-size: 1rem;
	font-weight: 600;
	border: none;
	border-radius: 6px;
	cursor: pointer;
	transition: all 0.3s ease;
	display: inline-flex;
	align-items: center;
	gap: 0.5rem;
	justify-content: center;
}

.btn-google {
	background: white;
	color: #333;
	border: 1px solid #ddd;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-google:hover {
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
	transform: translateY(-1px);
}

.btn-danger {
	background: #dc3545;
	color: white;
}

.btn-danger:hover {
	background: #c82333;
	transform: translateY(-1px);
}
</style>
