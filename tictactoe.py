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
    if winner == "O" : return 10 - depth
    if winner == "X" : return depth - 10
    if winner == "Draw" : return 0
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
    if difficulty == "어려움" or random.random() > 0.2:
        return random.choice(best_moves)
    else:
        suboptimal = [m for m in moves_with_scores if m[1] < max_score]
        if suboptimal:
            sub_max = max([m[1] for m in suboptimal])
            return random.choice([m[0] for m in suboptimal if m[1] == sub_max])
        return random.choice(best_moves)

# --- [초강력] 스트림릿 기본 중단점 무력화 CSS ---
st.set_page_config(page_title="No-Stack Tic-Tac-Toe", layout="centered")

st.markdown("""
    <style>
    /* 1. 최상위 컨테이너 여백 제거 */
    .block-container {
        padding: 10px !important;
        max-width: 100% !important;
    }

    /* 2. 스트림릿의 모바일 세로 쌓기(Column Stacking) 강제 방지 */
    /* 수평 블록의 모바일용 미디어 쿼리 속성을 강제로 덮어씁니다. */
    div[data-testid="stHorizontalBlock"] {
        display: flex !important;
        flex-direction: row !important; /* 무조건 가로 유지 */
        flex-wrap: nowrap !important; /* 줄바꿈 절대 금지 */
        width: 100% !important;
        gap: 2vw !important;
    }

    /* 컬럼이 모바일에서 100% 너비를 가지지 못하게 고정 */
    div[data-testid="stColumn"] {
        flex: 1 1 0% !important;
        width: 33.33% !important;
        min-width: 0 !important; /* 스트림릿의 기본 최소 너비 해제 */
    }

    /* 3. 버튼 정사각형 및 글자 크기 유동성 강화 */
    div.stButton > button {
        width: 100% !important;
        aspect-ratio: 1 / 1 !important;
        height: auto !important;
        padding: 0 !important;
        border: 2px solid #333 !important;
        background-color: white !important;
    }

    div.stButton > button p {
        font-size: 10vw !important; /* 화면 폭 비례 글자 크기 */
        font-weight: 900 !important;
        margin: 0 !important;
        line-height: 1 !important;
    }

    /* 새 게임 시작 버튼 전용 (가로로 길게) */
    div.stButton > button[kind="primary"] {
        aspect-ratio: auto !important;
        height: 50px !important;
        background-color: #333 !important;
        color: white !important;
        margin-top: 10px;
    }
    div.stButton > button[kind="primary"] p {
        font-size: 18px !important;
    }

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

st.sidebar.header("🕹️ 설정")
difficulty = st.sidebar.selectbox("난이도", ["어려움", "보통"])
order = st.sidebar.radio("순서", ["내가 선공 (X)", "컴퓨터 선공 (O)"])

if 'board' not in st.session_state: st.session_state.board = [""] * 9
if 'winner' not in st.session_state: st.session_state.winner = None
if 'initialized' not in st.session_state: st.session_state.initialized = False

def reset_game():
    st.session_state.board = [""] * 9
    st.session_state.winner = None
    st.session_state.initialized = False

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
            st.button(val if val != "" else " ", key=f"b{idx}", on_click=handle_click, args=(idx,), use_container_width=True, disabled=(val != "" or st.session_state.winner is not None))

if st.session_state.winner:
    st.button("새 게임 시작", type="primary", on_click=reset_game, use_container_width=True)