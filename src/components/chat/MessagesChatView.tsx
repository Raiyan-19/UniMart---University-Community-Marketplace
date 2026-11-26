import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Send,
  BadgeDollarSign,
  ShieldCheck,
  ShoppingBag,
  ArrowLeft,
} from 'lucide-react';
import { Conversation, ChatMessage, Product } from '../../types';
import { chatApi, offersApi, productsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface MessagesChatViewProps {
  initialProductId?: string;
  onViewProduct?: (productId: string) => void;
  onOpenMakeOffer?: (product: Product) => void;
}

export const MessagesChatView: React.FC<MessagesChatViewProps> = ({
  onViewProduct,
  onOpenMakeOffer,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  const handleChatScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // Within 80px of bottom counts as being at bottom
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const fetchConversations = async () => {
    try {
      const res = await chatApi.getConversations();
      if (res.data) {
        setConversations(res.data);
        if (res.data.length > 0 && !activeConversationId) {
          setActiveConversationId(res.data[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
      return;
    }
    fetchConversations();
  }, [user?.id]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) return;

    let isFirstLoad = true;

    const fetchMessages = async () => {
      try {
        const res = await chatApi.getMessages(activeConversationId);
        if (res.data) {
          setMessages((prev) => {
            const hasChanged =
              prev.length !== res.data!.length ||
              (res.data!.length > 0 && prev[prev.length - 1]?.id !== res.data![res.data!.length - 1]?.id);

            if (!hasChanged) return prev;

            if (isFirstLoad) {
              setTimeout(() => {
                scrollToBottom('auto');
                isAtBottomRef.current = true;
              }, 40);
            } else if (isAtBottomRef.current) {
              setTimeout(() => scrollToBottom('smooth'), 40);
            }

            return res.data!;
          });

          if (isFirstLoad) {
            isFirstLoad = false;
          }
        }
      } catch (err: any) {
        console.error(err);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3500); // Poll for real-time messages
    return () => clearInterval(interval);
  }, [activeConversationId]);

  // Load product info for the active conversation
  const activeConv = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    if (!activeConv?.productId) {
      setActiveProduct(null);
      return;
    }
    productsApi
      .getById(activeConv.productId)
      .then((res) => {
        if (res.data) setActiveProduct(res.data);
      })
      .catch(() => setActiveProduct(null));
  }, [activeConv?.productId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversationId || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const res = await chatApi.sendMessage(activeConversationId, textToSend);
      if (res.data) {
        setMessages((prev) => [...prev, res.data!]);
        fetchConversations();
        isAtBottomRef.current = true;
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleAcceptOffer = async (_offerAmount?: number) => {
    try {
      // Find offer in user offers
      const offersRes = await offersApi.getUserOffers('received');
      const targetOffer = offersRes.data?.find(
        (o) => o.productId === activeConv?.productId && o.status === 'PENDING'
      );

      if (targetOffer) {
        await offersApi.acceptOffer(targetOffer.id);
        showToast('Offer accepted! Marked as sold and transaction recorded.', 'success');
        fetchConversations();
        if (activeConversationId) {
          const res = await chatApi.getMessages(activeConversationId);
          if (res.data) setMessages(res.data);
        }
      } else {
        showToast('No active pending offer found to accept.', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'Could not accept offer.', 'error');
    }
  };

  const filteredConversations = conversations.filter((c) =>
    search
      ? c.otherUserName.toLowerCase().includes(search.toLowerCase()) ||
      c.productTitle.toLowerCase().includes(search.toLowerCase())
      : true
  );

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px] sm:min-h-[580px]">
      <div className="grid grid-cols-1 md:grid-cols-12 h-full min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-gray-200">
        {/* Left Column: Conversations List (Hidden on mobile if chat is open) */}
        <div
          className={`${
            mobileView === 'chat' ? 'hidden md:flex' : 'flex'
          } md:col-span-4 lg:col-span-4 flex-col h-full min-h-0 overflow-hidden bg-gray-50/50`}
        >
          <div className="p-3.5 sm:p-4 border-b border-gray-200 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">Messages</h2>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                {conversations.length} Active
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="overflow-y-auto flex-1 min-h-0 divide-y divide-gray-100 overscroll-contain">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConversationId;
                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setMobileView('chat');
                    }}
                    className={`w-full text-left p-3 sm:p-3.5 flex items-center gap-3 transition cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-700'
                        : 'hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {conv.otherUserAvatar ? (
                        <img
                          src={conv.otherUserAvatar}
                          alt={conv.otherUserName}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {conv.otherUserName.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                          {conv.otherUserName}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                        <span className="capitalize text-[10px] bg-gray-200 text-gray-700 px-1 rounded">
                          {conv.otherUserRole}
                        </span>
                        <span className="truncate text-[11px] text-emerald-700 font-medium">
                          • {conv.productTitle}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-xs text-gray-500">
                No active conversations yet. Click "Chat with Seller" on any marketplace listing to begin.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window (Hidden on mobile if list is open) */}
        <div
          className={`${
            mobileView === 'list' ? 'hidden md:flex' : 'flex'
          } md:col-span-8 lg:col-span-8 flex-col h-full min-h-0 overflow-hidden bg-white`}
        >
          {activeConv ? (
            <>
              {/* Active Header & Product Banner */}
              <div className="p-3 sm:p-3.5 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* Mobile Back Button to Conversations List */}
                    <button
                      type="button"
                      onClick={() => setMobileView('list')}
                      className="md:hidden p-1.5 -ml-1 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                      title="Back to conversations"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    {activeConv.otherUserAvatar ? (
                      <img
                        src={activeConv.otherUserAvatar}
                        alt={activeConv.otherUserName}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                        {activeConv.otherUserName.charAt(0)}
                      </div>
                    )}
                    <div className="truncate">
                      <div className="font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5 truncate">
                        <span className="truncate">{activeConv.otherUserName}</span>
                        <span className="capitalize text-[10px] font-medium bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded shrink-0">
                          {activeConv.otherUserRole}
                        </span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-gray-400 truncate">
                        {activeConv.otherUserUniversity || 'Campus Member'} • Active now
                      </div>
                    </div>
                  </div>

                  {activeProduct && onOpenMakeOffer && activeProduct.sellerId !== user?.id && (
                    <button
                      type="button"
                      onClick={() => onOpenMakeOffer(activeProduct)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                      <BadgeDollarSign className="w-3.5 h-3.5" />
                      Make Offer
                    </button>
                  )}
                </div>

                {/* Related Product Mini Card */}
                {activeProduct && (
                  <div className="mt-2.5 p-2 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={activeProduct.images[0] || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80'}
                        alt={activeProduct.title}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallbackApplied) {
                            target.dataset.fallbackApplied = 'true';
                            target.src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80';
                          }
                        }}
                      />
                      <div className="truncate">
                        <span className="font-semibold text-gray-900 text-xs truncate block">
                          {activeProduct.title}
                        </span>
                        <span className="text-xs font-bold text-emerald-800">
                          ৳ {activeProduct.price.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onViewProduct && onViewProduct(activeProduct.id)}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100/50 rounded-lg transition shrink-0"
                    >
                      View Item
                    </button>
                  </div>
                )}
              </div>

              {/* Messages Body */}
              <div
                ref={chatContainerRef}
                onScroll={handleChatScroll}
                className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-gray-50/40 overscroll-contain"
              >
                <div className="text-center my-2">
                  <span className="text-[10px] font-semibold text-gray-400 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    Direct Campus Negotiation Thread
                  </span>
                </div>

                {messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;

                  if (msg.isOffer) {
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'} my-2`}
                      >
                        <div className="max-w-sm w-full bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-sm space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                              <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                              Official Campus Offer
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          <div className="text-xl font-extrabold text-gray-900">
                            ৳ {msg.offerAmount?.toLocaleString()}
                          </div>

                          <p className="text-xs text-gray-600">{msg.text}</p>

                          {/* If receiver is current user (seller) and product is not yet sold, allow accept */}
                          {!isMine && activeProduct?.sellerId === user?.id && activeProduct?.status === 'active' && (
                            <div className="pt-2 flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleAcceptOffer(msg.offerAmount)}
                                className="flex-1 py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
                              >
                                Accept Offer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm ${isMine
                            ? 'bg-emerald-800 text-white rounded-tr-xs'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-xs shadow-2xs'
                          }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Footer */}
              <div className="p-3 border-t border-gray-200 bg-white shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your message or negotiate meetup time..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition disabled:opacity-40"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Always arrange exchange in public campus areas (library, cafeteria).
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 space-y-3">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
              <h3 className="font-semibold text-gray-700 text-sm">Select a Conversation</h3>
              <p className="text-xs max-w-xs text-gray-400">
                Choose a chat from the left panel or start one from any marketplace listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
