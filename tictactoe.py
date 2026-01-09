import streamlit as st
import math
import random
import streamlit.components.v1 as components


# --- 게임 로직 함수 (동일) ---
def check_winner(board):
    win_combinations = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]]
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
                board[i] = "O";
                score = minimax(board, depth + 1, False);
                board[i] = ""
                best_score = max(score, best_score)
        return best_score
    else:
        best_score = math.inf
        for i in range(9):
            if board[i] == "":
                board[i] = "X";
                score = minimax(board, depth + 1, True);
                board[i] = ""
                best_score = min(score, best_score)
        return best_score


def get_ai_move(board, difficulty):
    moves_with_scores = []
    for i in range(9):
        if board[i] == "":
            board[i] = "O";
            score = minimax(board, 0, False);
            board[i] = "";
            moves_with_scores.append((i, score))
    if not moves_with_scores: return None
    moves_with_scores.sort(key=lambda x: x[1], reverse=True)
    max_score = moves_with_scores[0][1]
    best_moves = [m[0] for m in moves_with_scores if m[1] == max_score]
    if difficulty == "어려움" or random.random() > 0.2:
        return random.choice(best_moves)
    else:
        suboptimal = [m for m in moves_with_scores if m[1] < max_score]
        if suboptimal:
            sub_max = max([m[1] for m in suboptimal])
            return random.choice([m[0] for m in suboptimal if m[1] == sub_max])
        return random.choice(best_moves)


# --- UI 및 디자인 설정 ---
st.set_page_config(page_title="Compact Tic-Tac-Toe", layout="centered")

# CSS: 크기를 절반으로 줄이고 리셋 버튼 강조
st.markdown("""
    <style>
    .main-title {
        text-align: center;
        font-size: 40px !important;
        font-weight: 800;
        margin-bottom: 10px;
        color: #333;
    }

    /* 게임 보드 버튼 - 이전의 절반 크기 */
    div.stButton > button {
        height: 90px !important; 
        width: 100% !important;
        border-radius: 12px !important;
        border: 2px solid #333 !important;
        background-color: #ffffff !important;
    }

    /* 보드 안의 X, O 텍스트 크기 */
    div.stButton > button p {
        font-size: 60px !important; 
        font-weight: 900 !important;
        line-height: 90px !important;
        font-family: 'Arial Black', sans-serif !important;
    }

    /* "새 게임 시작" 버튼 전용 스타일 */
    div.stButton > button[kind="primary"] {
        height: 50px !important;
        background-color: #333 !important; /* 검은색 배경 */
        color: white !important; /* 흰색 글자 */
        border: none !important;
        font-size: 20px !important;
        margin-top: 20px;
    }

    div.stButton > button[kind="primary"] p {
        font-size: 18px !important;
        line-height: 50px !important;
        color: white !important;
    }

    .status-text {
        text-align: center;
        font-size: 20px !important;
        font-weight: bold;
        margin-top: 10px;
    }
    </style>
""", unsafe_allow_html=True)

# JavaScript: 글자 색상 실시간 변경
components.html("""
    <script>
    const interval = setInterval(() => {
        const buttons = window.parent.document.querySelectorAll('button p');
        buttons.forEach(p => {
            if (p.innerText === 'X') {
                p.style.color = '#007BFF'; // Blue
            } else if (p.innerText === 'O') {
                p.style.color = '#FF4136'; // Red
            }
        });
    }, 50);
    </script>
""", height=0)

st.markdown('<p class="main-title">Tic-Tac-Toe</p>', unsafe_allow_html=True)

# 사이드바
st.sidebar.header("🕹️ 옵션")
difficulty = st.sidebar.selectbox("난이도", ["어려움", "보통"])
order = st.sidebar.radio("순서", ["내가 선공 (X)", "컴퓨터 선공 (O)"])

# 세션 상태
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
    if comp_move is not None:
        st.session_state.board[comp_move] = "O"
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


# 보드 출력 (절반 크기)
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

# 하단 결과 및 리셋 버튼
if st.session_state.winner:
    if st.session_state.winner == "Draw":
        st.markdown('<p class="status-text">🤝 무승부!</p>', unsafe_allow_html=True)
    else:
        st.markdown(f'<p class="status-text">{st.session_state.winner} 승리! 🎉</p>', unsafe_allow_html=True)

    # type="primary"를 주어 CSS에서 별도로 스타일링 가능하게 함
    if st.button("새 게임 시작", type="primary", on_click=reset_game):
        st.rerun()
else:
    st.markdown('<p class="status-text">당신은 X (파랑) 입니다</p>', unsafe_allow_html=True)