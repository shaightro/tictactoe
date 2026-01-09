import streamlit as st
import math
import random
import streamlit.components.v1 as components


# --- 게임 로직 함수 (기본 로직은 동일) ---
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


# --- [수정됨] 글자 잘림 방지 및 중앙 정렬 강화 CSS ---
st.set_page_config(page_title="Tic-Tac-Toe Final Fix", layout="centered")

st.markdown("""
    <style>
    /* 전체 레이아웃 최적화 */
    .block-container {
        padding: 10px !important;
        max-width: 450px !important;
        margin: auto;
    }

    /* 가로 3열 강제 유지 */
    div[data-testid="stHorizontalBlock"] {
        display: flex !important;
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        gap: 8px !important;
    }

    div[data-testid="stColumn"] {
        flex: 1 1 0% !important;
        width: 33.33% !important;
        min-width: 0 !important;
    }

    /* 버튼 스타일: 글자 잘림 방지를 위해 정렬 방식 변경 */
    div.stButton > button {
        width: 100% !important;
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        padding: 0 !important; /* 내부 여백 제거 */
        border: 2px solid #333 !important;
        background-color: white !important;
        border-radius: 8px !important;
        /* 중앙 정렬 강제 적용 */
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
    }

    /* 버튼 안의 X, O 텍스트 스타일 수정 */
    div.stButton > button p {
        font-size: 15vw !important; /* 화면 폭 비례 크기 */
        max-font-size: 60px;
        font-weight: 900 !important;
        font-family: 'Arial Black', sans-serif !important;
        margin: 0 !important;
        padding: 0 !important;
        line-height: 1.2 !important; /* 글자가 잘리지 않도록 여유값 부여 */
        display: block !important;
        text-align: center !important;
    }

    /* 새 게임 시작 버튼 (하단) */
    div.stButton > button[kind="primary"] {
        aspect-ratio: auto !important;
        height: 50px !important;
        background-color: #333 !important;
        color: white !important;
        margin-top: 15px;
    }
    div.stButton > button[kind="primary"] p {
        font-size: 18px !important;
        line-height: 1.5 !important;
    }

    .main-title { text-align: center; font-size: 32px; font-weight: 800; margin-bottom: 5px; }
    .status-text { text-align: center; font-size: 18px; font-weight: bold; margin: 10px 0; }
    </style>
""", unsafe_allow_html=True)

# JavaScript: 색상 실시간 적용
components.html("""
    <script>
    setInterval(() => {
        const pTags = window.parent.document.querySelectorAll('button p');
        pTags.forEach(p => {
            if (p.innerText === 'X') p.style.color = '#007BFF';
            else if (p.innerText === 'O') p.style.color = '#FF4136';
        });
    }, 50);
    </script>
""", height=0)

st.markdown('<p class="main-title">Tic-Tac-Toe</p>', unsafe_allow_html=True)

# 사이드바 설정
with st.sidebar:
    st.header("🕹️ 설정")
    difficulty = st.selectbox("난이도", ["어려움", "보통"])
    order = st.radio("순서", ["내가 선공 (X)", "컴퓨터 선공 (O)"])

# 세션 상태 초기화
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


# 상단 상태 알림
if st.session_state.winner:
    msg = "🤝 무승부!" if st.session_state.winner == "Draw" else f"{st.session_state.winner} 승리! 🎉"
    st.markdown(f'<p class="status-text">{msg}</p>', unsafe_allow_html=True)
else:
    st.markdown('<p class="status-text">당신은 파란색 X 입니다</p>', unsafe_allow_html=True)

# 3x3 격자 출력
for r in range(3):
    cols = st.columns(3)
    for c in range(3):
        idx = r * 3 + c
        with cols[c]:
            val = st.session_state.board[idx]
            st.button(
                val if val != "" else " ",
                key=f"b{idx}",
                on_click=handle_click,
                args=(idx,),
                use_container_width=True,
                disabled=(val != "" or st.session_state.winner is not None)
            )

if st.session_state.winner:
    st.button("새 게임 시작", type="primary", on_click=reset_game, use_container_width=True)