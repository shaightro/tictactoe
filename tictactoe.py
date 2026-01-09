import streamlit as st
import math
import random
import streamlit.components.v1 as components

# --- 게임 로직 함수 (기존과 동일) ---
def check_winner(board):
    win_combinations = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]
    for combo in win_combinations:
        if board[combo[0]] == board[combo[1]] == board[combo[2]] != "":
            return board[combo[0]]
    if "" not in board: return "Draw"
    return None

def minimax(board, depth, is_maximizing):
    winner = check_winner(board)
    if winner == "O": return 10 - depth
    if winner == "X": return depth - 10
    if winner == "Draw": return 0
    if is_maximizing:
        best_score = -math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = "O"; score = minimax(board, depth + 1, False); board[i] = ""
                best_score = max(score, best_score)
        return best_score
    else:
        best_score = math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = "X"; score = minimax(board, depth + 1, True); board[i] = ""
                best_score = min(score, best_score)
        return best_score

def get_ai_move(board, difficulty):
    moves_with_scores = []
    for i in range(9):
        if board[i] == "":
            board[i] = "O"; score = minimax(board, 0, False); board[i] = ""; moves_with_scores.append((i, score))
    if not moves_with_scores: return None
    moves_with_scores.sort(key=lambda x: x[1], reverse=True)
    max_score = moves_with_scores[0][1]
    best_moves = [m[0] for m in moves_with_scores if m[1] == max_score]
    if difficulty == "어려움 (최적)" or random.random() > 0.2:
        return random.choice(best_moves)
    else:
        suboptimal = [m for m in moves_with_scores if m[1] < max_score]
        if suboptimal:
            sub_max = max([m[1] for m in suboptimal])
            return random.choice([m[0] for m in suboptimal if m[1] == sub_max])
        return random.choice(best_moves)

# --- UI 및 반응형 디자인 설정 ---
st.set_page_config(page_title="Responsive Tic-Tac-Toe", layout="centered")

st.markdown("""
    <style>
    /* 1. 모바일에서도 3열 배치를 강제 유지 */
    [data-testid="stHorizontalBlock"] {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
    }
    [data-testid="column"] {
        width: 33.33% !important;
        flex: 1 1 33.33% !important;
        min-width: 33.33% !important;
    }

    /* 2. 버튼 크기 조정: 화면 너비에 비례하도록 설정 */
    div.stButton > button {
        width: 100% !important;
        aspect-ratio: 1 / 1 !important; /* 가로세로 1:1 유지 */
        height: auto !important;
        border-radius: 10px !important;
        border: 2px solid #333 !important;
        background-color: #ffffff !important;
        padding: 0 !important;
    }

    /* 3. 글자 크기: 화면 너비(vw)에 따라 동적으로 변함 */
    div.stButton > button p {
        font-size: clamp(30px, 12vw, 60px) !important; /* 최소 30px, 최대 60px, 평소엔 화면의 12% */
        font-weight: 900 !important;
        font-family: 'Arial Black', sans-serif !important;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    /* 4. "새 게임 시작" 버튼 강조 (검정 배경 + 흰색 글자) */
    div.stButton > button[kind="primary"] {
        aspect-ratio: auto !important;
        height: 50px !important;
        background-color: #333 !important;
        color: white !important;
        border: none !important;
        margin-top: 20px;
    }
    div.stButton > button[kind="primary"] p {
        font-size: 18px !important;
        color: white !important;
    }

    .main-title { text-align: center; font-size: 30px; font-weight: 800; margin-bottom: 10px; }
    .status-text { text-align: center; font-size: 18px; font-weight: bold; margin-top: 10px; }
    </style>
""", unsafe_allow_html=True)

# JavaScript: 색상 변경
components.html("""
    <script>
    const interval = setInterval(() => {
        const buttons = window.parent.document.querySelectorAll('button p');
        buttons.forEach(p => {
            if (p.innerText === 'X') p.style.color = '#007BFF';
            else if (p.innerText === 'O') p.style.color = '#FF4136';
        });
    }, 50);
    </script>
""", height=0)

st.markdown('<p class="main-title">Tic-Tac-Toe</p>', unsafe_allow_html=True)

# 사이드바 설정
with st.sidebar:
    st.header("🕹️ 옵션")
    difficulty = st.selectbox("난이도", ["어려움 (최적)", "보통 (20% 확률로 실수)"])
    order = st.radio("순서", ["내가 선공 (X)", "컴퓨터 선공 (O)"])

# 세션 상태 관리
if 'board' not in st.session_state: st.session_state.board = [""] * 9
if 'winner' not in st.session_state: st.session_state.winner = None
if 'initialized' not in st.session_state: st.session_state.initialized = False

def reset_game():
    st.session_state.board = [""] * 9
    st.session_state.winner = None
    st.session_state.initialized = False

# 컴퓨터 선공 로직
if order == "컴퓨터 선공 (O)" and not st.session_state.initialized and "" not in st.session_state.board:
    comp_move = get_ai_move(st.session_state.board, difficulty)
    if comp_move is not None: st.session_state.board[comp_move] = "O"
    st.session_state.initialized = True

def handle_click(i):
    if st.session_state.board[i] == "" and st.session_state.winner is None:
        st.session_state.board[i] = "X"
        st.session_state.winner = check_winner(st.session_state.board)
        if st.session_state.winner is None:
            comp_move = get_ai_move(st.session_state.board, difficulty)
            if comp_move is not None:
                st.session_state.board[comp_move] = "O"
                st.session_state.winner = check_winner(st.session_state.board)

# 3x3 보드 출력
cols = st.columns(3)
for i in range(9):
    with cols[i % 3]:
        val = st.session_state.board[i]
        st.button(
            val if val != "" else " ",
            key=f"btn_{i}",
            on_click=handle_click,
            args=(i,),
            use_container_width=True,
            disabled=(val != "" or st.session_state.winner is not None)
        )

# 하단 메시지 및 버튼
if st.session_state.winner:
    msg = "🤝 무승부!" if st.session_state.winner == "Draw" else f"{st.session_state.winner} 승리! 🎉"
    st.markdown(f'<p class="status-text">{msg}</p>', unsafe_allow_html=True)
    st.button("새 게임 시작", type="primary", on_click=reset_game, use_container_width=True)
else:
    st.markdown('<p class="status-text">당신은 X (파랑) 입니다</p>', unsafe_allow_html=True)