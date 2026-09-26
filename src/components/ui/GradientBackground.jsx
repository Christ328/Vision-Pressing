export const GradientBackground = () => {
  return (
    <div 
      style={{
        position: 'absolute',
        inset: 0,
        height: '100%',
        width: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(125% 125% at 50% -50%, #c7d2fe 40%, transparent 100%)'
      }}
    />
  );
};
