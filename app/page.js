                        ) : (
                          <span className="text-white/60">—</span>
                        )}
                      </div>

                      {item.description ? (
                        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white/85 whitespace-pre-wrap">
                          {item.description}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 md:min-w-[160px]">
                      <button
                        onClick={() => approveSubmission(item)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-medium transition"
                      >
                        {isProcessing ? 'Processing...' : 'Approve'}
                      </button>

                      <button
                        onClick={() => deleteSubmission(item.id)}
                        disabled={isProcessing}
                        className="flex-1 md:flex-none rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 font-medium transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
