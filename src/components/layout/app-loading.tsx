type TAppLoadingProps = {
  message?: string
}

export const AppLoading = ({ message }: TAppLoadingProps) => {
  return (
    <div className="flex flex-col justify-center items-center min-h-screen px-4 py-8 bg-regular-dark-gray-cl">
      <div className="w-16 h-16 border-4 border-regular-violet-cl border-t-transparent rounded-full animate-spin"></div>
      <p className="text-base text-white mt-5">
        {message || "Checking your authentication status..."}
      </p>
    </div>
  )
}
